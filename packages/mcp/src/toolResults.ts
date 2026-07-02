/**
 * MCP tool result envelopes shared by both server implementations
 * (SDK-based TreeLocatorMCPServer and hand-rolled ManualMcpServer).
 */

import { SessionBrokerError } from "./sessionBroker";

export interface ToolErrorInfo {
  code: string;
  message: string;
  details?: unknown;
}

export function successResult(payload: Record<string, unknown>) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(payload, null, 2) }],
    structuredContent: payload,
  };
}

export function errorResult(code: string, message: string, details?: unknown) {
  const payload = {
    error: {
      code,
      message,
      details: details ?? null,
    },
  };
  return {
    content: [{ type: "text" as const, text: JSON.stringify(payload, null, 2) }],
    structuredContent: payload,
    isError: true,
  };
}

export function toErrorPayload(error: unknown): ToolErrorInfo {
  if (error instanceof SessionBrokerError) {
    return {
      code: error.code,
      message: error.message,
      details: error.details,
    };
  }
  if (error instanceof Error) {
    return {
      code: "internal_error",
      message: error.message,
    };
  }
  return {
    code: "internal_error",
    message: "Unknown error",
  };
}
