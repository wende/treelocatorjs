export const BRIDGE_PATH = "/treelocator";
export const CONTROL_PATH = "/treelocator-control";
export const BRIDGE_DEFAULT_PORT = 7463;
export const BRIDGE_INSECURE_PORT = 7464;

export const BRIDGE_COMMANDS = [
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
] as const;

export type BridgeCommandName = (typeof BRIDGE_COMMANDS)[number];

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

export interface PingMessage {
  type: "ping";
  timestamp: number;
}

export interface PongMessage {
  type: "pong";
  timestamp: number;
}

export type BridgeMessageIn = HelloMessage | CommandResponse | PingMessage;
export type BridgeMessageOut = CommandRequest | PongMessage;

export interface SessionInfo {
  sessionId: string;
  url: string;
  title: string;
  runtimeVersion: string;
  capabilities: BridgeCommandName[];
  connectedAt: string;
  lastSeenAt: string;
}

export function isBridgeCommand(value: string): value is BridgeCommandName {
  return (BRIDGE_COMMANDS as readonly string[]).includes(value);
}
