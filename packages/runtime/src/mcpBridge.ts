import type { LocatorJSAPI } from "./browserApi";
import { getConsoleEntries, installConsoleCapture } from "./consoleCapture";

export const MCP_BRIDGE_DEFAULT_URL = "wss://127.0.0.1:7463/treelocator";
export const MCP_BRIDGE_FALLBACK_URL = "wss://localhost:7463/treelocator";

const HEARTBEAT_MS = 20_000;
const MAX_RECONNECT_MS = 5 * 60_000;
const QUIET_RETRY_AFTER_FAILURES = 2;
const QUIET_RETRY_MS = 5 * 60_000;

export type BridgeCommandName =
  | "get_path"
  | "get_ancestry"
  | "get_path_data"
  | "get_styles"
  | "get_css_rules"
  | "get_css_report"
  | "take_snapshot"
  | "get_snapshot_diff"
  | "clear_snapshot"
  | "click"
  | "hover"
  | "type"
  | "execute_js"
  | "get_console";

export interface HelloMessage {
  type: "hello";
  sessionId: string;
  url: string;
  title: string;
  runtimeVersion: string;
  capabilities: BridgeCommandName[];
  connectedAt: string;
}

export interface CommandRequest {
  type: "command";
  id: string;
  command: BridgeCommandName;
  args?: Record<string, unknown>;
}

export interface CommandResponse {
  type: "response";
  id: string;
  ok: boolean;
  result?: unknown;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

interface PingMessage {
  type: "ping";
  timestamp: number;
}

interface PongMessage {
  type: "pong";
  timestamp: number;
}

type BridgeInboundMessage = CommandRequest | PongMessage;
type BridgeOutboundMessage = HelloMessage | CommandResponse | PingMessage;

export interface MCPBridgeConfig {
  enabled?: boolean;
  bridgeUrl?: string;
  reconnectMs?: number;
}

class BridgeRuntimeError extends Error {
  readonly code: string;
  readonly details?: unknown;

  constructor(code: string, message: string, details?: unknown) {
    super(message);
    this.name = "BridgeRuntimeError";
    this.code = code;
    this.details = details;
  }
}

const SESSION_ID_STORAGE_KEY = "treelocator:sessionId";

function generateSessionId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `tl-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function createSessionId(): string {
  // Persist per tab via sessionStorage so reloads keep the same id — the
  // broker accepts rehello on an existing id and just swaps the socket, so
  // MCP callers don't need to re-run connect_session after a page refresh.
  let storage: Storage | null = null;
  try {
    storage = typeof sessionStorage !== "undefined" ? sessionStorage : null;
  } catch {
    storage = null;
  }

  if (storage) {
    try {
      const existing = storage.getItem(SESSION_ID_STORAGE_KEY);
      if (existing) return existing;
    } catch {
      // Access can throw under strict privacy settings — fall through.
    }
  }

  const fresh = generateSessionId();
  if (storage) {
    try {
      storage.setItem(SESSION_ID_STORAGE_KEY, fresh);
    } catch {
      // Quota or privacy mode — not fatal, we just won't persist.
    }
  }
  return fresh;
}

function parseMessage(raw: unknown): BridgeInboundMessage | null {
  if (typeof raw !== "string") return null;
  try {
    const parsed = JSON.parse(raw) as BridgeInboundMessage;
    if (!parsed || typeof parsed !== "object") return null;
    if (
      "type" in parsed &&
      (parsed.type === "command" || parsed.type === "pong")
    ) {
      return parsed;
    }
  } catch {
    return null;
  }
  return null;
}

function resolveElement(selector: string, index = 0): HTMLElement {
  let elements: NodeListOf<Element>;
  try {
    elements = document.querySelectorAll(selector);
  } catch {
    throw new BridgeRuntimeError("invalid_selector", `Invalid selector: ${selector}`);
  }

  const element = elements.item(index);
  if (!(element instanceof HTMLElement)) {
    throw new BridgeRuntimeError(
      "element_not_found",
      `No HTMLElement found for selector "${selector}" at index ${index}`
    );
  }

  return element;
}

function getTargetArgs(args?: Record<string, unknown>): {
  selector: string;
  index: number;
} {
  const selector = typeof args?.selector === "string" ? args.selector : "";
  if (!selector) {
    throw new BridgeRuntimeError("invalid_args", "selector is required");
  }

  const rawIndex = args?.index;
  const index =
    typeof rawIndex === "number" && Number.isInteger(rawIndex) && rawIndex >= 0
      ? rawIndex
      : 0;

  return { selector, index };
}

function dispatchHover(element: HTMLElement): void {
  const eventWindow = element.ownerDocument.defaultView;
  const MouseEventCtor = eventWindow?.MouseEvent || MouseEvent;
  const eventInit: MouseEventInit = {
    bubbles: true,
    cancelable: true,
    composed: true,
  };
  element.dispatchEvent(new MouseEventCtor("mouseenter", eventInit));
  element.dispatchEvent(new MouseEventCtor("mouseover", eventInit));
  element.dispatchEvent(new MouseEventCtor("mousemove", eventInit));
}

function dispatchType(
  element: HTMLElement,
  text: string,
  submit: boolean
): { value: string } {
  if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
    element.focus();
    element.value = text;
    element.dispatchEvent(new Event("input", { bubbles: true, cancelable: true }));
    element.dispatchEvent(new Event("change", { bubbles: true, cancelable: true }));

    if (submit) {
      element.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Enter", bubbles: true })
      );
      element.dispatchEvent(
        new KeyboardEvent("keyup", { key: "Enter", bubbles: true })
      );
      if (element.form && typeof element.form.requestSubmit === "function") {
        element.form.requestSubmit();
      }
    }

    return { value: element.value };
  }

  if (element.isContentEditable) {
    element.focus();
    element.textContent = text;
    element.dispatchEvent(new Event("input", { bubbles: true, cancelable: true }));
    return { value: element.textContent || "" };
  }

  throw new BridgeRuntimeError(
    "unsupported_target",
    "type target must be input, textarea, or contenteditable"
  );
}

function safeSerialize(value: unknown): unknown {
  const seen = new WeakSet<object>();
  const walk = (v: unknown): unknown => {
    if (v === null || v === undefined) return v ?? null;
    const t = typeof v;
    if (t === "string" || t === "number" || t === "boolean") return v;
    if (t === "bigint") return (v as bigint).toString();
    if (t === "function") {
      const name = (v as { name?: string }).name || "anonymous";
      return `[Function: ${name}]`;
    }
    if (t === "symbol") return (v as symbol).toString();
    if (v instanceof Error) {
      return { name: v.name, message: v.message, stack: v.stack };
    }
    if (typeof Element !== "undefined" && v instanceof Element) {
      const el = v as Element;
      return `[Element: <${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ""}>]`;
    }
    if (t === "object") {
      if (seen.has(v as object)) return "[Circular]";
      seen.add(v as object);
      if (Array.isArray(v)) return v.map(walk);
      const out: Record<string, unknown> = {};
      for (const key of Object.keys(v as object)) {
        try {
          out[key] = walk((v as Record<string, unknown>)[key]);
        } catch (err) {
          out[key] = `[Unreadable: ${(err as Error).message}]`;
        }
      }
      return out;
    }
    return String(v);
  };
  return walk(value);
}

const AsyncFunctionCtor = Object.getPrototypeOf(async function () { /* probe */ }).constructor as {
  new (...args: string[]): (...fnArgs: unknown[]) => Promise<unknown>;
};

async function runUserCode(code: string): Promise<unknown> {
  let fn: (...a: unknown[]) => Promise<unknown>;
  try {
    fn = new AsyncFunctionCtor(code);
  } catch (err) {
    throw new BridgeRuntimeError(
      "compile_error",
      err instanceof Error ? err.message : "Failed to compile code"
    );
  }
  try {
    return await fn();
  } catch (err) {
    throw new BridgeRuntimeError(
      "runtime_error",
      err instanceof Error ? err.message : "Execution failed",
      err instanceof Error ? { stack: err.stack } : undefined
    );
  }
}

export async function executeBridgeCommand(
  api: LocatorJSAPI,
  command: BridgeCommandName,
  args?: Record<string, unknown>
): Promise<unknown> {
  switch (command) {
    case "get_path": {
      const { selector } = getTargetArgs(args);
      return await api.getPath(selector);
    }
    case "get_ancestry": {
      const { selector } = getTargetArgs(args);
      return await api.getAncestry(selector);
    }
    case "get_path_data": {
      const { selector } = getTargetArgs(args);
      return await api.getPathData(selector);
    }
    case "get_styles": {
      const { selector } = getTargetArgs(args);
      const options =
        args && typeof args.options === "object" && args.options !== null
          ? (args.options as Record<string, unknown>)
          : undefined;
      return api.getStyles(selector, {
        includeDefaults:
          typeof options?.includeDefaults === "boolean"
            ? options.includeDefaults
            : undefined,
      });
    }
    case "get_css_rules": {
      const { selector } = getTargetArgs(args);
      return api.getCSSRules(selector);
    }
    case "get_css_report": {
      const { selector } = getTargetArgs(args);
      const properties = Array.isArray(args?.properties)
        ? args?.properties.filter((item): item is string => typeof item === "string")
        : undefined;
      return api.getCSSReport(selector, properties ? { properties } : undefined);
    }
    case "take_snapshot": {
      const selector = typeof args?.selector === "string" ? args.selector : "";
      const snapshotId =
        typeof args?.snapshotId === "string" ? args.snapshotId : "";
      if (!selector) {
        throw new BridgeRuntimeError("invalid_args", "selector is required");
      }
      if (!snapshotId) {
        throw new BridgeRuntimeError("invalid_args", "snapshotId is required");
      }
      const index =
        typeof args?.index === "number" && Number.isInteger(args.index) && args.index >= 0
          ? args.index
          : 0;
      const label = typeof args?.label === "string" ? args.label : undefined;
      return api.takeSnapshot(selector, snapshotId, { index, label });
    }
    case "get_snapshot_diff": {
      const snapshotId =
        typeof args?.snapshotId === "string" ? args.snapshotId : "";
      if (!snapshotId) {
        throw new BridgeRuntimeError("invalid_args", "snapshotId is required");
      }
      return api.getSnapshotDiff(snapshotId);
    }
    case "clear_snapshot": {
      const snapshotId =
        typeof args?.snapshotId === "string" ? args.snapshotId : "";
      if (!snapshotId) {
        throw new BridgeRuntimeError("invalid_args", "snapshotId is required");
      }
      api.clearSnapshot(snapshotId);
      return { ok: true };
    }
    case "click": {
      const { selector, index } = getTargetArgs(args);
      const element = resolveElement(selector, index);
      if (typeof element.click === "function") {
        element.click();
      } else {
        const eventWindow = element.ownerDocument.defaultView;
        const MouseEventCtor = eventWindow?.MouseEvent || MouseEvent;
        element.dispatchEvent(
          new MouseEventCtor("click", {
            bubbles: true,
            cancelable: true,
            composed: true,
          })
        );
      }
      return { ok: true };
    }
    case "hover": {
      const { selector, index } = getTargetArgs(args);
      const element = resolveElement(selector, index);
      dispatchHover(element);
      return { ok: true };
    }
    case "type": {
      const { selector, index } = getTargetArgs(args);
      const element = resolveElement(selector, index);
      const text = typeof args?.text === "string" ? args.text : "";
      if (!text) {
        throw new BridgeRuntimeError("invalid_args", "text is required for type");
      }
      const submit = typeof args?.submit === "boolean" ? args.submit : false;
      return dispatchType(element, text, submit);
    }
    case "execute_js": {
      const code = typeof args?.code === "string" ? args.code : "";
      if (!code) {
        throw new BridgeRuntimeError("invalid_args", "code is required for execute_js");
      }
      const result = await runUserCode(code);
      return {
        type: result === null ? "null" : typeof result,
        value: safeSerialize(result),
      };
    }
    case "get_console": {
      const rawLast = args?.last;
      const last =
        typeof rawLast === "number" && Number.isFinite(rawLast) && rawLast > 0
          ? Math.floor(rawLast)
          : undefined;
      const captured = getConsoleEntries(last);
      return { count: captured.length, entries: captured };
    }
    default:
      throw new BridgeRuntimeError("unsupported_command", `Unsupported command: ${command}`);
  }
}

function getBridgeUrls(config?: MCPBridgeConfig): string[] {
  const urls: string[] = [];

  if (!config?.bridgeUrl) {
    urls.push(MCP_BRIDGE_DEFAULT_URL, MCP_BRIDGE_FALLBACK_URL);
    return urls;
  }

  urls.push(config.bridgeUrl);
  try {
    const parsed = new URL(config.bridgeUrl);
    if (parsed.hostname === "127.0.0.1") {
      parsed.hostname = "localhost";
      urls.push(parsed.toString());
    } else if (parsed.hostname === "localhost") {
      parsed.hostname = "127.0.0.1";
      urls.push(parsed.toString());
    }
  } catch {
    // Keep the configured URL only when parsing fails.
  }

  return urls;
}

export class TreeLocatorMCPBridgeClient {
  private readonly config: MCPBridgeConfig;
  private readonly sessionId: string;
  private readonly runtimeVersion: string;
  private readonly getApi: () => LocatorJSAPI | undefined;

  private socket: WebSocket | null = null;
  private heartbeatTimer: number | null = null;
  private reconnectTimer: number | null = null;
  private reconnectAttempts = 0;
  private consecutiveFailures = 0;
  private urlIndex = 0;
  private stopped = false;

  constructor(
    getApi: () => LocatorJSAPI | undefined,
    config?: MCPBridgeConfig,
    runtimeVersion = "unknown"
  ) {
    this.getApi = getApi;
    this.config = config || {};
    this.sessionId = createSessionId();
    this.runtimeVersion = runtimeVersion;
  }

  start(): void {
    if (this.config.enabled === false) return;
    if (typeof window === "undefined" || typeof WebSocket === "undefined") return;
    this.connect();
  }

  stop(): void {
    this.stopped = true;
    this.clearTimers();
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  private connect(): void {
    if (this.stopped || this.config.enabled === false || this.socket) return;

    const urls = getBridgeUrls(this.config);
    const url = urls[this.urlIndex % urls.length];
    if (!url) return;

    const socket = new WebSocket(url);
    this.socket = socket;

    socket.addEventListener("open", () => {
      this.reconnectAttempts = 0;
      this.consecutiveFailures = 0;
      this.sendHello();
      this.startHeartbeat();
    });

    socket.addEventListener("message", (event) => {
      void this.handleMessage(event.data);
    });

    socket.addEventListener("close", () => {
      this.socket = null;
      this.clearHeartbeat();
      this.scheduleReconnect();
    });

    socket.addEventListener("error", () => {
      socket.close();
    });
  }

  private sendMessage(message: BridgeOutboundMessage): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;
    this.socket.send(JSON.stringify(message));
  }

  private sendHello(): void {
    const hello: HelloMessage = {
      type: "hello",
      sessionId: this.sessionId,
      url: window.location.href,
      title: document.title || "",
      runtimeVersion: this.runtimeVersion,
      capabilities: [
        "get_path",
        "get_ancestry",
        "get_path_data",
        "get_styles",
        "get_css_rules",
        "get_css_report",
        "take_snapshot",
        "get_snapshot_diff",
        "clear_snapshot",
        "click",
        "hover",
        "type",
        "execute_js",
        "get_console",
      ],
      connectedAt: new Date().toISOString(),
    };
    this.sendMessage(hello);
  }

  private async handleMessage(data: unknown): Promise<void> {
    const message = parseMessage(data);
    if (!message) return;

    if (message.type === "pong") {
      return;
    }

    const api = this.getApi();
    if (!api) {
      this.sendMessage({
        type: "response",
        id: message.id,
        ok: false,
        error: {
          code: "api_unavailable",
          message: "window.__treelocator__ is not available",
        },
      });
      return;
    }

    try {
      const result = await executeBridgeCommand(api, message.command, message.args);
      this.sendMessage({
        type: "response",
        id: message.id,
        ok: true,
        result,
      });
    } catch (error) {
      const bridgeError =
        error instanceof BridgeRuntimeError
          ? error
          : new BridgeRuntimeError(
              "runtime_error",
              error instanceof Error ? error.message : "Unknown bridge error"
            );

      this.sendMessage({
        type: "response",
        id: message.id,
        ok: false,
        error: {
          code: bridgeError.code,
          message: bridgeError.message,
          details: bridgeError.details,
        },
      });
    }
  }

  private startHeartbeat(): void {
    this.clearHeartbeat();
    this.heartbeatTimer = window.setInterval(() => {
      this.sendMessage({
        type: "ping",
        timestamp: Date.now(),
      });
    }, HEARTBEAT_MS);
  }

  private clearHeartbeat(): void {
    if (this.heartbeatTimer !== null) {
      window.clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private scheduleReconnect(): void {
    if (this.stopped || this.config.enabled === false || this.reconnectTimer !== null) {
      return;
    }

    const baseReconnect = this.config.reconnectMs && this.config.reconnectMs > 0
      ? this.config.reconnectMs
      : 1_000;
    const delay =
      this.consecutiveFailures >= QUIET_RETRY_AFTER_FAILURES
        ? QUIET_RETRY_MS
        : Math.min(
            baseReconnect * Math.pow(2, this.reconnectAttempts),
            MAX_RECONNECT_MS
          );
    this.reconnectAttempts += 1;
    this.consecutiveFailures += 1;
    this.urlIndex += 1;

    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }

  private clearTimers(): void {
    this.clearHeartbeat();
    if (this.reconnectTimer !== null) {
      window.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
}

export function startMCPBridge(config?: MCPBridgeConfig): TreeLocatorMCPBridgeClient | null {
  if (config?.enabled === false) return null;
  if (typeof window === "undefined") return null;

  installConsoleCapture();

  const client = new TreeLocatorMCPBridgeClient(
    () => (window as Window & { __treelocator__?: LocatorJSAPI }).__treelocator__,
    config
  );
  client.start();
  return client;
}
