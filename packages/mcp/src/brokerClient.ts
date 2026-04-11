import https from "node:https";
import {
  BRIDGE_DEFAULT_PORT,
  BridgeCommandName,
  CONTROL_PATH,
  SessionInfo,
} from "./protocol";
import { SessionBroker, SessionCommandOptions } from "./sessionBroker";
import { SessionBrokerError } from "./sessionBroker";

interface ControlSuccessResponse {
  ok: true;
  result: unknown;
}

interface ControlErrorResponse {
  ok: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

type ControlResponse = ControlSuccessResponse | ControlErrorResponse;

type ControlRequest =
  | { action: "list_sessions" }
  | { action: "get_session"; sessionId: string }
  | {
      action: "send_command";
      sessionId: string;
      command: BridgeCommandName;
      args?: Record<string, unknown>;
      timeoutMs?: number;
    };

export interface BrokerClient {
  listSessions(): Promise<SessionInfo[]>;
  getSession(sessionId: string): Promise<SessionInfo | null>;
  hasSession(sessionId: string): Promise<boolean>;
  sendCommand(
    sessionId: string,
    command: BridgeCommandName,
    args?: Record<string, unknown>,
    options?: SessionCommandOptions
  ): Promise<unknown>;
}

export class LocalSessionBrokerClient implements BrokerClient {
  private readonly broker: SessionBroker;

  constructor(broker: SessionBroker) {
    this.broker = broker;
  }

  async listSessions(): Promise<SessionInfo[]> {
    return this.broker.listSessions();
  }

  async getSession(sessionId: string): Promise<SessionInfo | null> {
    return this.broker.getSession(sessionId);
  }

  async hasSession(sessionId: string): Promise<boolean> {
    return this.broker.hasSession(sessionId);
  }

  async sendCommand(
    sessionId: string,
    command: BridgeCommandName,
    args?: Record<string, unknown>,
    options?: SessionCommandOptions
  ): Promise<unknown> {
    return await this.broker.sendCommand(sessionId, command, args, options);
  }
}

export interface RemoteSessionBrokerClientOptions {
  controlUrls?: string[];
  requestTimeoutMs?: number;
}

export class RemoteSessionBrokerClient implements BrokerClient {
  private readonly controlUrls: string[];
  private readonly requestTimeoutMs: number;

  constructor(options?: RemoteSessionBrokerClientOptions) {
    this.controlUrls =
      options?.controlUrls && options.controlUrls.length > 0
        ? options.controlUrls
        : [
            `https://127.0.0.1:${BRIDGE_DEFAULT_PORT}${CONTROL_PATH}`,
            `https://localhost:${BRIDGE_DEFAULT_PORT}${CONTROL_PATH}`,
          ];
    this.requestTimeoutMs = options?.requestTimeoutMs ?? 10_000;
  }

  async listSessions(): Promise<SessionInfo[]> {
    const response = await this.request({ action: "list_sessions" });
    return response as SessionInfo[];
  }

  async getSession(sessionId: string): Promise<SessionInfo | null> {
    const response = await this.request({ action: "get_session", sessionId });
    return response as SessionInfo | null;
  }

  async hasSession(sessionId: string): Promise<boolean> {
    const session = await this.getSession(sessionId);
    return Boolean(session);
  }

  async sendCommand(
    sessionId: string,
    command: BridgeCommandName,
    args?: Record<string, unknown>,
    options?: SessionCommandOptions
  ): Promise<unknown> {
    return await this.request({
      action: "send_command",
      sessionId,
      command,
      args,
      timeoutMs: options?.timeoutMs,
    });
  }

  private async request(request: ControlRequest): Promise<unknown> {
    let lastError: Error | null = null;
    for (const urlString of this.controlUrls) {
      try {
        return await this.requestToUrl(urlString, request);
      } catch (error) {
        lastError =
          error instanceof Error ? error : new Error("Unknown remote broker error");
      }
    }

    throw new SessionBrokerError(
      "proxy_unavailable",
      lastError?.message || "No active TreeLocator broker leader is reachable"
    );
  }

  private async requestToUrl(urlString: string, request: ControlRequest): Promise<unknown> {
    const url = new URL(urlString);
    const body = JSON.stringify(request);
    const timeoutMs =
      request.action === "send_command" && request.timeoutMs
        ? request.timeoutMs + 1_000
        : this.requestTimeoutMs;

    const response = await new Promise<ControlResponse>((resolve, reject) => {
      const req = https.request(
        {
          method: "POST",
          hostname: url.hostname,
          port: url.port,
          path: url.pathname,
          rejectUnauthorized: false,
          timeout: timeoutMs,
          headers: {
            "content-type": "application/json",
            "content-length": Buffer.byteLength(body, "utf8"),
          },
        },
        (res) => {
          let text = "";
          res.setEncoding("utf8");
          res.on("data", (chunk) => {
            text += chunk;
          });
          res.on("end", () => {
            if (!text) {
              reject(new Error("Empty response from TreeLocator broker"));
              return;
            }
            try {
              const parsed = JSON.parse(text) as ControlResponse;
              resolve(parsed);
            } catch {
              reject(new Error("Invalid JSON response from TreeLocator broker"));
            }
          });
        }
      );

      req.on("timeout", () => {
        req.destroy(new Error("Proxy request timeout"));
      });
      req.on("error", (error) => {
        reject(error);
      });
      req.write(body);
      req.end();
    });

    if (response.ok) {
      return response.result;
    }

    throw new SessionBrokerError(
      response.error.code || "proxy_error",
      response.error.message || "Remote broker request failed",
      response.error.details
    );
  }
}
