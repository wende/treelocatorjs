import { createServer as createHttpsServer, Server as HTTPSServer } from "node:https";
import {
  createServer as createHttpServer,
  IncomingMessage,
  Server as HTTPServer,
} from "node:http";
import { AddressInfo } from "node:net";
import { randomUUID } from "node:crypto";
import { WebSocket, WebSocketServer } from "ws";
import {
  BRIDGE_DEFAULT_PORT,
  BRIDGE_PATH,
  CONTROL_PATH,
  BridgeCommandName,
  isBridgeCommand,
  BridgeMessageIn,
  BridgeMessageOut,
  CommandRequest,
  CommandResponse,
  HelloMessage,
  PingMessage,
  PongMessage,
  SessionInfo,
} from "./protocol";

export class SessionBrokerError extends Error {
  readonly code: string;
  readonly details?: unknown;

  constructor(code: string, message: string, details?: unknown) {
    super(message);
    this.name = "SessionBrokerError";
    this.code = code;
    this.details = details;
  }
}

interface SessionRecord {
  socket: WebSocket;
  info: SessionInfo;
}

interface PendingCommand {
  sessionId: string;
  resolve: (value: unknown) => void;
  reject: (error: Error) => void;
  timeout: NodeJS.Timeout;
  abortSignal?: AbortSignal;
  abortHandler?: () => void;
}

export interface SessionBrokerOptions {
  host?: string;
  port?: number;
  path?: string;
  controlPath?: string;
  insecurePort?: number;
  key: string;
  cert: string;
  defaultTimeoutMs?: number;
}

export interface SessionCommandOptions {
  timeoutMs?: number;
  signal?: AbortSignal;
}

export class SessionBroker {
  private readonly host: string;
  private readonly port: number;
  private readonly insecurePort: number | null;
  private readonly path: string;
  private readonly controlPath: string;
  private readonly key: string;
  private readonly cert: string;
  private readonly defaultTimeoutMs: number;

  private httpServer: HTTPSServer | null = null;
  private insecureHttpServer: HTTPServer | null = null;
  private wss: WebSocketServer | null = null;
  private sessions = new Map<string, SessionRecord>();
  private socketToSessionId = new Map<WebSocket, string>();
  private pending = new Map<string, PendingCommand>();

  constructor(options: SessionBrokerOptions) {
    this.host = options.host || "127.0.0.1";
    this.port = options.port ?? BRIDGE_DEFAULT_PORT;
    this.insecurePort =
      typeof options.insecurePort === "number" ? options.insecurePort : null;
    this.path = options.path || BRIDGE_PATH;
    this.controlPath = options.controlPath || CONTROL_PATH;
    this.key = options.key;
    this.cert = options.cert;
    this.defaultTimeoutMs = options.defaultTimeoutMs ?? 10_000;
  }

  async start(): Promise<void> {
    if (this.httpServer || this.wss) return;

    this.httpServer = createHttpsServer({
      key: this.key,
      cert: this.cert,
    });
    this.attachHttpHandlers(this.httpServer);

    this.wss = new WebSocketServer({ noServer: true });
    this.wss.on("connection", (socket, request) => {
      this.handleConnection(socket, request);
    });

    await new Promise<void>((resolve, reject) => {
      this.httpServer?.once("error", reject);
      this.httpServer?.listen(this.port, this.host, () => {
        this.httpServer?.off("error", reject);
        resolve();
      });
    });

    if (this.insecurePort !== null) {
      this.insecureHttpServer = createHttpServer();
      this.attachHttpHandlers(this.insecureHttpServer);
      await new Promise<void>((resolve, reject) => {
        this.insecureHttpServer?.once("error", reject);
        this.insecureHttpServer?.listen(this.insecurePort!, this.host, () => {
          this.insecureHttpServer?.off("error", reject);
          resolve();
        });
      });
    }
  }

  async stop(): Promise<void> {
    const wss = this.wss;
    const httpServer = this.httpServer;
    const insecureHttpServer = this.insecureHttpServer;
    this.wss = null;
    this.httpServer = null;
    this.insecureHttpServer = null;

    for (const pending of this.pending.values()) {
      clearTimeout(pending.timeout);
      pending.reject(
        new SessionBrokerError("shutdown", "Broker stopped while command was pending")
      );
      if (pending.abortSignal && pending.abortHandler) {
        pending.abortSignal.removeEventListener("abort", pending.abortHandler);
      }
    }
    this.pending.clear();

    for (const session of this.sessions.values()) {
      session.socket.close();
    }
    this.sessions.clear();
    this.socketToSessionId.clear();

    await Promise.all([
      new Promise<void>((resolve) => {
        wss?.close(() => resolve());
        if (!wss) resolve();
      }),
      new Promise<void>((resolve) => {
        httpServer?.close(() => resolve());
        if (!httpServer) resolve();
      }),
      new Promise<void>((resolve) => {
        insecureHttpServer?.close(() => resolve());
        if (!insecureHttpServer) resolve();
      }),
    ]);
  }

  getAddress(): { host: string; port: number; path: string } {
    if (!this.httpServer) {
      return { host: this.host, port: this.port, path: this.path };
    }
    const address = this.httpServer.address();
    if (!address || typeof address === "string") {
      return { host: this.host, port: this.port, path: this.path };
    }
    const info = address as AddressInfo;
    return { host: info.address, port: info.port, path: this.path };
  }

  getInsecureAddress():
    | { host: string; port: number; path: string }
    | null {
    if (!this.insecureHttpServer) return null;
    const address = this.insecureHttpServer.address();
    if (!address || typeof address === "string") {
      return this.insecurePort === null
        ? null
        : { host: this.host, port: this.insecurePort, path: this.path };
    }
    const info = address as AddressInfo;
    return { host: info.address, port: info.port, path: this.path };
  }

  getControlPath(): string {
    return this.controlPath;
  }

  listSessions(): SessionInfo[] {
    return Array.from(this.sessions.values())
      .map((session) => session.info)
      .sort((a, b) => a.connectedAt.localeCompare(b.connectedAt));
  }

  getSession(sessionId: string): SessionInfo | null {
    return this.sessions.get(sessionId)?.info || null;
  }

  hasSession(sessionId: string): boolean {
    return this.sessions.has(sessionId);
  }

  async sendCommand(
    sessionId: string,
    command: BridgeCommandName,
    args?: Record<string, unknown>,
    options?: SessionCommandOptions
  ): Promise<unknown> {
    const record = this.sessions.get(sessionId);
    if (!record) {
      throw new SessionBrokerError(
        "session_not_found",
        `No session found for id: ${sessionId}`
      );
    }
    if (record.socket.readyState !== WebSocket.OPEN) {
      throw new SessionBrokerError(
        "session_disconnected",
        `Session ${sessionId} is not connected`
      );
    }

    const commandId = randomUUID();
    const timeoutMs = options?.timeoutMs || this.defaultTimeoutMs;
    const message: CommandRequest = {
      type: "command",
      id: commandId,
      command,
      args,
    };

    return await new Promise<unknown>((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pending.delete(commandId);
        reject(
          new SessionBrokerError(
            "command_timeout",
            `Command ${command} timed out after ${timeoutMs}ms`,
            { command, timeoutMs }
          )
        );
      }, timeoutMs);

      const pending: PendingCommand = {
        sessionId,
        resolve: (value) => {
          clearTimeout(timeout);
          if (pending.abortSignal && pending.abortHandler) {
            pending.abortSignal.removeEventListener("abort", pending.abortHandler);
          }
          resolve(value);
        },
        reject: (error) => {
          clearTimeout(timeout);
          if (pending.abortSignal && pending.abortHandler) {
            pending.abortSignal.removeEventListener("abort", pending.abortHandler);
          }
          reject(error);
        },
        timeout,
      };

      if (options?.signal) {
        pending.abortSignal = options.signal;
        pending.abortHandler = () => {
          this.pending.delete(commandId);
          pending.reject(
            new SessionBrokerError(
              "command_cancelled",
              `Command ${command} was cancelled`,
              { command }
            )
          );
        };
        if (pending.abortSignal.aborted) {
          pending.abortHandler();
          return;
        }
        pending.abortSignal.addEventListener("abort", pending.abortHandler, {
          once: true,
        });
      }

      this.pending.set(commandId, pending);
      try {
        record.socket.send(JSON.stringify(message));
      } catch (error) {
        this.pending.delete(commandId);
        pending.reject(
          new SessionBrokerError(
            "command_send_failed",
            error instanceof Error ? error.message : "Failed to send command"
          )
        );
      }
    });
  }

  private handleConnection(socket: WebSocket, _request: IncomingMessage): void {
    socket.on("message", (data) => {
      this.handleMessage(socket, data.toString());
    });

    socket.on("close", () => {
      this.handleSocketClose(socket);
    });
  }

  private handleMessage(socket: WebSocket, raw: string): void {
    let message: BridgeMessageIn;
    try {
      message = JSON.parse(raw) as BridgeMessageIn;
    } catch {
      return;
    }
    if (!message || typeof message !== "object" || !("type" in message)) return;

    switch (message.type) {
      case "hello":
        this.handleHello(socket, message);
        return;
      case "response":
        this.handleResponse(message);
        return;
      case "ping":
        this.handlePing(socket, message);
        return;
      default:
        return;
    }
  }

  private handleHello(socket: WebSocket, hello: HelloMessage): void {
    if (!hello.sessionId || !hello.url || !hello.connectedAt) {
      return;
    }

    const existing = this.sessions.get(hello.sessionId);
    if (existing && existing.socket !== socket) {
      existing.socket.close();
      this.sessions.delete(hello.sessionId);
      this.socketToSessionId.delete(existing.socket);
    }

    const now = new Date().toISOString();
    const info: SessionInfo = {
      sessionId: hello.sessionId,
      url: hello.url,
      title: hello.title || "",
      runtimeVersion: hello.runtimeVersion || "unknown",
      capabilities: hello.capabilities || [],
      connectedAt: hello.connectedAt,
      lastSeenAt: now,
    };

    this.sessions.set(hello.sessionId, { socket, info });
    this.socketToSessionId.set(socket, hello.sessionId);
  }

  private handleResponse(message: CommandResponse): void {
    const pending = this.pending.get(message.id);
    if (!pending) return;
    this.pending.delete(message.id);

    if (message.ok) {
      pending.resolve(message.result);
      return;
    }

    pending.reject(
      new SessionBrokerError(
        message.error?.code || "command_failed",
        message.error?.message || "Bridge command failed",
        message.error?.details
      )
    );
  }

  private handlePing(socket: WebSocket, ping: PingMessage): void {
    const sessionId = this.socketToSessionId.get(socket);
    if (sessionId) {
      const record = this.sessions.get(sessionId);
      if (record) {
        record.info.lastSeenAt = new Date().toISOString();
      }
    }

    const pong: PongMessage = {
      type: "pong",
      timestamp: ping.timestamp || Date.now(),
    };
    this.send(socket, pong);
  }

  private handleSocketClose(socket: WebSocket): void {
    const sessionId = this.socketToSessionId.get(socket);
    if (!sessionId) return;

    this.socketToSessionId.delete(socket);
    this.sessions.delete(sessionId);

    for (const [commandId, pending] of this.pending.entries()) {
      if (pending.sessionId !== sessionId) continue;
      this.pending.delete(commandId);
      pending.reject(
        new SessionBrokerError(
          "session_disconnected",
          `Session ${sessionId} disconnected while command was pending`
        )
      );
    }
  }

  private send(socket: WebSocket, message: BridgeMessageOut): void {
    if (socket.readyState !== WebSocket.OPEN) return;
    socket.send(JSON.stringify(message));
  }

  private attachHttpHandlers(server: HTTPSServer | HTTPServer): void {
    server.on("request", (req, res) => {
      void this.handleHttpRequest(req, res);
    });
    server.on("upgrade", (request, socket, head) => {
      const requestPath = new URL(request.url || "/", "https://localhost").pathname;
      if (requestPath !== this.path) {
        socket.destroy();
        return;
      }
      this.wss?.handleUpgrade(request, socket, head, (websocket) => {
        this.wss?.emit("connection", websocket, request);
      });
    });
  }

  private async handleHttpRequest(
    req: IncomingMessage,
    res: import("node:http").ServerResponse
  ): Promise<void> {
    const urlPath = new URL(req.url || "/", "https://localhost").pathname;
    if (req.method !== "POST" || urlPath !== this.controlPath) {
      res.statusCode = 404;
      res.end();
      return;
    }

    try {
      const body = await this.readRequestBody(req);
      const request = JSON.parse(body) as {
        action?: string;
        sessionId?: string;
        command?: string;
        args?: Record<string, unknown>;
        timeoutMs?: number;
      };

      if (!request || typeof request.action !== "string") {
        this.writeControlError(res, "invalid_request", "Missing action");
        return;
      }

      if (request.action === "list_sessions") {
        this.writeControlSuccess(res, this.listSessions());
        return;
      }

      if (request.action === "get_session") {
        if (!request.sessionId) {
          this.writeControlError(res, "invalid_request", "Missing sessionId");
          return;
        }
        this.writeControlSuccess(res, this.getSession(request.sessionId));
        return;
      }

      if (request.action === "send_command") {
        if (!request.sessionId) {
          this.writeControlError(res, "invalid_request", "Missing sessionId");
          return;
        }
        if (!request.command || !isBridgeCommand(request.command)) {
          this.writeControlError(res, "invalid_request", "Missing or invalid command");
          return;
        }

        const result = await this.sendCommand(
          request.sessionId,
          request.command,
          request.args,
          {
            timeoutMs:
              typeof request.timeoutMs === "number" && request.timeoutMs > 0
                ? request.timeoutMs
                : undefined,
          }
        );
        this.writeControlSuccess(res, result);
        return;
      }

      this.writeControlError(res, "invalid_request", `Unknown action: ${request.action}`);
    } catch (error) {
      const sessionError =
        error instanceof SessionBrokerError
          ? error
          : new SessionBrokerError(
              "internal_error",
              error instanceof Error ? error.message : "Unknown control error"
            );
      this.writeControlError(
        res,
        sessionError.code,
        sessionError.message,
        sessionError.details
      );
    }
  }

  private readRequestBody(req: IncomingMessage): Promise<string> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      let bytes = 0;
      const maxBytes = 1_000_000;

      req.on("data", (chunk: Buffer) => {
        bytes += chunk.length;
        if (bytes > maxBytes) {
          reject(new Error("Request body too large"));
          return;
        }
        chunks.push(chunk);
      });
      req.on("end", () => {
        resolve(Buffer.concat(chunks).toString("utf8"));
      });
      req.on("error", reject);
    });
  }

  private writeControlSuccess(
    res: import("node:http").ServerResponse,
    result: unknown
  ): void {
    res.statusCode = 200;
    res.setHeader("content-type", "application/json");
    res.end(
      JSON.stringify({
        ok: true,
        result,
      })
    );
  }

  private writeControlError(
    res: import("node:http").ServerResponse,
    code: string,
    message: string,
    details?: unknown
  ): void {
    res.statusCode = 200;
    res.setHeader("content-type", "application/json");
    res.end(
      JSON.stringify({
        ok: false,
        error: {
          code,
          message,
          details: details ?? null,
        },
      })
    );
  }
}
