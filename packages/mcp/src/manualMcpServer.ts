import { BridgeCommandName } from "./protocol";
import { SessionBrokerError } from "./sessionBroker";
import { CompatStdioServerTransport } from "./compatStdioTransport";
import { BrokerClient } from "./brokerClient";
import {
  getCssReportSchema,
  getStylesSchema,
  selectorSchema,
  sessionIdSchema,
  snapshotIdSchema,
  takeSnapshotSchema,
  typeSchema,
} from "./toolSchemas";

type JsonRpcId = string | number;

interface JsonRpcRequest {
  jsonrpc: "2.0";
  id?: JsonRpcId;
  method: string;
  params?: Record<string, unknown>;
}

interface JsonRpcResponse {
  jsonrpc: "2.0";
  id: JsonRpcId | null;
  result?: unknown;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

interface ToolDescriptor {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

const TOOL_DESCRIPTORS: ToolDescriptor[] = [
  {
    name: "treelocator_list_sessions",
    description: "List connected browser runtime sessions.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "treelocator_connect_session",
    description:
      "Select the active browser runtime session by sessionId for future tool calls.",
    inputSchema: {
      type: "object",
      properties: {
        sessionId: { type: "string" },
      },
      required: ["sessionId"],
      additionalProperties: false,
    },
  },
  {
    name: "treelocator_get_path",
    description: "Call window.__treelocator__.getPath(selector).",
    inputSchema: selectorInputSchema(),
  },
  {
    name: "treelocator_get_ancestry",
    description: "Call window.__treelocator__.getAncestry(selector).",
    inputSchema: selectorInputSchema(),
  },
  {
    name: "treelocator_get_path_data",
    description: "Call window.__treelocator__.getPathData(selector).",
    inputSchema: selectorInputSchema(),
  },
  {
    name: "treelocator_get_styles",
    description: "Call window.__treelocator__.getStyles(selector, options).",
    inputSchema: {
      ...selectorInputSchema(),
      properties: {
        sessionId: { type: "string" },
        selector: { type: "string" },
        index: { type: "integer", minimum: 0 },
        options: {
          type: "object",
          properties: {
            includeDefaults: { type: "boolean" },
          },
          additionalProperties: false,
        },
      },
    },
  },
  {
    name: "treelocator_get_css_rules",
    description: "Call window.__treelocator__.getCSSRules(selector).",
    inputSchema: selectorInputSchema(),
  },
  {
    name: "treelocator_get_css_report",
    description: "Call window.__treelocator__.getCSSReport(selector, { properties }).",
    inputSchema: {
      ...selectorInputSchema(),
      properties: {
        sessionId: { type: "string" },
        selector: { type: "string" },
        index: { type: "integer", minimum: 0 },
        properties: {
          type: "array",
          items: { type: "string" },
        },
      },
    },
  },
  {
    name: "treelocator_take_snapshot",
    description:
      "Capture computed styles of an element and persist them under snapshotId (survives reloads). Call treelocator_get_snapshot_diff with the same id to see what changed later.",
    inputSchema: {
      type: "object",
      properties: {
        sessionId: { type: "string" },
        selector: { type: "string" },
        snapshotId: { type: "string" },
        index: { type: "integer", minimum: 0 },
        label: { type: "string" },
      },
      required: ["selector", "snapshotId"],
      additionalProperties: false,
    },
  },
  {
    name: "treelocator_get_snapshot_diff",
    description:
      "Diff the element stored under snapshotId against its baseline. The baseline is never overwritten — safe to call repeatedly while iterating on a change.",
    inputSchema: {
      type: "object",
      properties: {
        sessionId: { type: "string" },
        snapshotId: { type: "string" },
      },
      required: ["snapshotId"],
      additionalProperties: false,
    },
  },
  {
    name: "treelocator_clear_snapshot",
    description: "Remove the baseline snapshot stored under snapshotId.",
    inputSchema: {
      type: "object",
      properties: {
        sessionId: { type: "string" },
        snapshotId: { type: "string" },
      },
      required: ["snapshotId"],
      additionalProperties: false,
    },
  },
  {
    name: "treelocator_click",
    description: "Click a target element on the active page by selector/index.",
    inputSchema: selectorInputSchema(),
  },
  {
    name: "treelocator_hover",
    description: "Hover a target element on the active page by selector/index.",
    inputSchema: selectorInputSchema(),
  },
  {
    name: "treelocator_type",
    description: "Type text into an input/textarea/contenteditable element.",
    inputSchema: {
      ...selectorInputSchema(),
      properties: {
        sessionId: { type: "string" },
        selector: { type: "string" },
        index: { type: "integer", minimum: 0 },
        text: { type: "string" },
        submit: { type: "boolean" },
      },
      required: ["selector", "text"],
    },
  },
];

function selectorInputSchema(): Record<string, unknown> {
  return {
    type: "object",
    properties: {
      sessionId: { type: "string" },
      selector: { type: "string" },
      index: { type: "integer", minimum: 0 },
    },
    required: ["selector"],
    additionalProperties: false,
  };
}

function normalizeParams(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function toolSuccess(payload: Record<string, unknown>): Record<string, unknown> {
  return {
    content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
    structuredContent: payload,
  };
}

function toolError(
  code: string,
  message: string,
  details?: unknown
): Record<string, unknown> {
  const payload = {
    error: {
      code,
      message,
      details: details ?? null,
    },
  };
  return {
    content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
    structuredContent: payload,
    isError: true,
  };
}

function toSessionError(error: unknown): {
  code: string;
  message: string;
  details?: unknown;
} {
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

export interface ManualMcpServerOptions {
  broker: BrokerClient;
  toolTimeoutMs?: number;
}

export class ManualMcpServer {
  private readonly broker: BrokerClient;
  private readonly toolTimeoutMs: number;
  private readonly transport: CompatStdioServerTransport;
  private selectedSessionId: string | null = null;
  private readonly cancellations = new Map<JsonRpcId, AbortController>();

  constructor(options: ManualMcpServerOptions) {
    this.broker = options.broker;
    this.toolTimeoutMs = options.toolTimeoutMs ?? 10_000;
    this.transport = new CompatStdioServerTransport();
    this.transport.onmessage = (message) => {
      void this.handleIncoming(message);
    };
    this.transport.onerror = () => {
      // No-op: MCP hosts may close/retry on parse noise.
    };
  }

  async start(): Promise<void> {
    await this.transport.start();
  }

  private async handleIncoming(message: unknown): Promise<void> {
    const request = message as JsonRpcRequest;
    if (!request || request.jsonrpc !== "2.0" || typeof request.method !== "string") {
      return;
    }

    if (request.id === undefined) {
      await this.handleNotification(request.method, normalizeParams(request.params));
      return;
    }

    const response = await this.handleRequest(
      request.id,
      request.method,
      normalizeParams(request.params)
    );
    await this.transport.send(response);
  }

  private async handleNotification(
    method: string,
    params: Record<string, unknown>
  ): Promise<void> {
    if (method === "notifications/cancelled") {
      const requestId = params.requestId;
      if (typeof requestId === "string" || typeof requestId === "number") {
        const controller = this.cancellations.get(requestId);
        controller?.abort();
        this.cancellations.delete(requestId);
      }
    }
  }

  private async handleRequest(
    id: JsonRpcId,
    method: string,
    params: Record<string, unknown>
  ): Promise<JsonRpcResponse> {
    try {
      if (method === "initialize") {
        return {
          jsonrpc: "2.0",
          id,
          result: {
            protocolVersion:
              typeof params.protocolVersion === "string"
                ? params.protocolVersion
                : "2024-11-05",
            capabilities: {
              tools: {
                listChanged: false,
              },
            },
            serverInfo: {
              name: "treelocator",
              version: "0.5.2",
            },
          },
        };
      }

      if (method === "tools/list") {
        return {
          jsonrpc: "2.0",
          id,
          result: {
            tools: TOOL_DESCRIPTORS,
          },
        };
      }

      if (method === "resources/list") {
        return {
          jsonrpc: "2.0",
          id,
          result: {
            resources: [],
          },
        };
      }

      if (method === "resources/templates/list") {
        return {
          jsonrpc: "2.0",
          id,
          result: {
            resourceTemplates: [],
          },
        };
      }

      if (method === "prompts/list") {
        return {
          jsonrpc: "2.0",
          id,
          result: {
            prompts: [],
          },
        };
      }

      if (method === "tools/call") {
        const toolName = typeof params.name === "string" ? params.name : "";
        const args = normalizeParams(params.arguments);
        const abortController = new AbortController();
        this.cancellations.set(id, abortController);
        try {
          const result = await this.callTool(toolName, args, abortController.signal);
          return {
            jsonrpc: "2.0",
            id,
            result,
          };
        } finally {
          this.cancellations.delete(id);
        }
      }

      if (method === "ping") {
        return {
          jsonrpc: "2.0",
          id,
          result: {},
        };
      }

      return {
        jsonrpc: "2.0",
        id,
        error: {
          code: -32601,
          message: `Method not found: ${method}`,
        },
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Internal error";
      return {
        jsonrpc: "2.0",
        id,
        error: {
          code: -32603,
          message,
        },
      };
    }
  }

  private async resolveSessionId(requestedSessionId?: string): Promise<string> {
    if (requestedSessionId) {
      if (!(await this.broker.hasSession(requestedSessionId))) {
        throw new SessionBrokerError(
          "session_not_found",
          `Session \"${requestedSessionId}\" is not connected`
        );
      }
      return requestedSessionId;
    }

    if (!this.selectedSessionId) {
      throw new SessionBrokerError(
        "session_required",
        "No session selected. Call treelocator_connect_session first or pass sessionId."
      );
    }

    if (!(await this.broker.hasSession(this.selectedSessionId))) {
      this.selectedSessionId = null;
      throw new SessionBrokerError(
        "session_not_found",
        "Previously selected session is no longer connected."
      );
    }

    return this.selectedSessionId;
  }

  private async runBridgeTool(
    command: BridgeCommandName,
    args: Record<string, unknown>,
    signal: AbortSignal
  ): Promise<Record<string, unknown>> {
    try {
      const sessionId = await this.resolveSessionId(
        typeof args.sessionId === "string" ? args.sessionId : undefined
      );
      const { sessionId: _unused, ...bridgeArgs } = args;
      const result = await this.broker.sendCommand(sessionId, command, bridgeArgs, {
        timeoutMs: this.toolTimeoutMs,
        signal,
      });
      return toolSuccess({
        sessionId,
        result,
      });
    } catch (error) {
      const info = toSessionError(error);
      return toolError(info.code, info.message, info.details);
    }
  }

  private async callTool(
    toolName: string,
    rawArgs: Record<string, unknown>,
    signal: AbortSignal
  ): Promise<Record<string, unknown>> {
    if (toolName === "treelocator_list_sessions") {
      const sessions = await this.broker.listSessions();
      return toolSuccess({
        selectedSessionId: this.selectedSessionId,
        sessions,
      });
    }

    if (toolName === "treelocator_connect_session") {
      const parsed = sessionIdSchema.safeParse(rawArgs);
      if (!parsed.success) {
        return toolError("invalid_args", parsed.error.message);
      }
      const session = await this.broker.getSession(parsed.data.sessionId);
      if (!session) {
        return toolError(
          "session_not_found",
          `Session \"${parsed.data.sessionId}\" is not connected`
        );
      }
      this.selectedSessionId = parsed.data.sessionId;
      return toolSuccess({
        selectedSessionId: this.selectedSessionId,
        session,
      });
    }

    const selectorTools: Record<string, BridgeCommandName> = {
      treelocator_get_path: "get_path",
      treelocator_get_ancestry: "get_ancestry",
      treelocator_get_path_data: "get_path_data",
      treelocator_get_css_rules: "get_css_rules",
      treelocator_click: "click",
      treelocator_hover: "hover",
    };

    if (toolName in selectorTools) {
      const parsed = selectorSchema.safeParse(rawArgs);
      if (!parsed.success) {
        return toolError("invalid_args", parsed.error.message);
      }
      const command = selectorTools[toolName];
      if (!command) {
        return toolError("internal_error", `Unknown selector tool: ${toolName}`);
      }
      return await this.runBridgeTool(command, parsed.data, signal);
    }

    if (toolName === "treelocator_get_styles") {
      const parsed = getStylesSchema.safeParse(rawArgs);
      if (!parsed.success) {
        return toolError("invalid_args", parsed.error.message);
      }
      return await this.runBridgeTool("get_styles", parsed.data, signal);
    }

    if (toolName === "treelocator_get_css_report") {
      const parsed = getCssReportSchema.safeParse(rawArgs);
      if (!parsed.success) {
        return toolError("invalid_args", parsed.error.message);
      }
      return await this.runBridgeTool("get_css_report", parsed.data, signal);
    }

    if (toolName === "treelocator_take_snapshot") {
      const parsed = takeSnapshotSchema.safeParse(rawArgs);
      if (!parsed.success) {
        return toolError("invalid_args", parsed.error.message);
      }
      return await this.runBridgeTool("take_snapshot", parsed.data, signal);
    }

    if (
      toolName === "treelocator_get_snapshot_diff" ||
      toolName === "treelocator_clear_snapshot"
    ) {
      const parsed = snapshotIdSchema.safeParse(rawArgs);
      if (!parsed.success) {
        return toolError("invalid_args", parsed.error.message);
      }
      const command: BridgeCommandName =
        toolName === "treelocator_get_snapshot_diff"
          ? "get_snapshot_diff"
          : "clear_snapshot";
      return await this.runBridgeTool(command, parsed.data, signal);
    }

    if (toolName === "treelocator_type") {
      const parsed = typeSchema.safeParse(rawArgs);
      if (!parsed.success) {
        return toolError("invalid_args", parsed.error.message);
      }
      return await this.runBridgeTool("type", parsed.data, signal);
    }

    return toolError("tool_not_found", `Unknown tool: ${toolName}`);
  }
}
