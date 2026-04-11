import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { BridgeCommandName } from "./protocol";
import { SessionBroker, SessionBrokerError } from "./sessionBroker";
import { CompatStdioServerTransport } from "./compatStdioTransport";
import {
  executeJsSchema,
  getConsoleSchema,
  getCssReportSchema,
  getStylesSchema,
  selectorSchema,
  sessionIdSchema,
  snapshotIdSchema,
  takeSnapshotSchema,
  typeSchema,
} from "./toolSchemas";

type ToolResultPayload = Record<string, unknown>;

function successResult(payload: ToolResultPayload) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(payload, null, 2) }],
    structuredContent: payload,
  };
}

function errorResult(code: string, message: string, details?: unknown) {
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

function getAbortSignal(extra: unknown): AbortSignal | undefined {
  if (!extra || typeof extra !== "object") return undefined;
  if (!("signal" in extra)) return undefined;
  const maybeSignal = (extra as { signal?: AbortSignal }).signal;
  return maybeSignal instanceof AbortSignal ? maybeSignal : undefined;
}

function toErrorPayload(error: unknown): {
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

export interface TreeLocatorMCPServerOptions {
  broker: SessionBroker;
  toolTimeoutMs?: number;
}

export class TreeLocatorMCPServer {
  private readonly broker: SessionBroker;
  private readonly server: McpServer;
  private readonly toolTimeoutMs: number;
  private selectedSessionId: string | null = null;

  constructor(options: TreeLocatorMCPServerOptions) {
    this.broker = options.broker;
    this.toolTimeoutMs = options.toolTimeoutMs || 10_000;
    this.server = new McpServer({
      name: "treelocator",
      version: "0.5.2",
    });
    this.registerTools();
  }

  async connectStdio(): Promise<void> {
    const transport = new CompatStdioServerTransport();
    await this.server.connect(transport);
  }

  private resolveSessionId(requestedSessionId?: string): string {
    if (requestedSessionId) {
      if (!this.broker.hasSession(requestedSessionId)) {
        throw new SessionBrokerError(
          "session_not_found",
          `Session "${requestedSessionId}" is not connected`
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

    if (!this.broker.hasSession(this.selectedSessionId)) {
      this.selectedSessionId = null;
      throw new SessionBrokerError(
        "session_not_found",
        "Previously selected session is no longer connected."
      );
    }

    return this.selectedSessionId;
  }

  private async runBridgeCommand(
    command: BridgeCommandName,
    args: Record<string, unknown>,
    extra: unknown
  ) {
    try {
      const sessionId = this.resolveSessionId(
        typeof args.sessionId === "string" ? args.sessionId : undefined
      );
      const { sessionId: _ignored, ...bridgeArgs } = args;
      const result = await this.broker.sendCommand(sessionId, command, bridgeArgs, {
        timeoutMs: this.toolTimeoutMs,
        signal: getAbortSignal(extra),
      });

      return successResult({
        sessionId,
        result,
      });
    } catch (error) {
      const info = toErrorPayload(error);
      return errorResult(info.code, info.message, info.details);
    }
  }

  private registerTools(): void {
    this.server.registerTool(
      "treelocator_list_sessions",
      {
        title: "List TreeLocator sessions",
        description: "List connected browser runtime sessions.",
      },
      async () => {
        const sessions = this.broker.listSessions();
        return successResult({
          selectedSessionId: this.selectedSessionId,
          sessions,
        });
      }
    );

    this.server.registerTool(
      "treelocator_connect_session",
      {
        title: "Connect TreeLocator session",
        description:
          "Select the active browser runtime session by sessionId for future tool calls.",
        inputSchema: sessionIdSchema.shape,
      },
      async ({ sessionId }) => {
        const session = this.broker.getSession(sessionId);
        if (!session) {
          return errorResult(
            "session_not_found",
            `Session "${sessionId}" is not connected`
          );
        }

        this.selectedSessionId = sessionId;
        return successResult({
          selectedSessionId: sessionId,
          session,
        });
      }
    );

    this.server.registerTool(
      "treelocator_get_path",
      {
        title: "Get component path",
        description: "Call window.__treelocator__.getPath(selector) on the target page.",
        inputSchema: selectorSchema.shape,
      },
      async (args, extra) => this.runBridgeCommand("get_path", args, extra)
    );

    this.server.registerTool(
      "treelocator_get_ancestry",
      {
        title: "Get component ancestry",
        description: "Call window.__treelocator__.getAncestry(selector).",
        inputSchema: selectorSchema.shape,
      },
      async (args, extra) => this.runBridgeCommand("get_ancestry", args, extra)
    );

    this.server.registerTool(
      "treelocator_get_path_data",
      {
        title: "Get component path + ancestry",
        description: "Call window.__treelocator__.getPathData(selector).",
        inputSchema: selectorSchema.shape,
      },
      async (args, extra) => this.runBridgeCommand("get_path_data", args, extra)
    );

    this.server.registerTool(
      "treelocator_get_styles",
      {
        title: "Get computed styles",
        description: "Call window.__treelocator__.getStyles(selector, options).",
        inputSchema: getStylesSchema.shape,
      },
      async (args, extra) => this.runBridgeCommand("get_styles", args, extra)
    );

    this.server.registerTool(
      "treelocator_get_css_rules",
      {
        title: "Get matching CSS rules",
        description: "Call window.__treelocator__.getCSSRules(selector).",
        inputSchema: selectorSchema.shape,
      },
      async (args, extra) => this.runBridgeCommand("get_css_rules", args, extra)
    );

    this.server.registerTool(
      "treelocator_get_css_report",
      {
        title: "Get CSS rule report",
        description:
          "Call window.__treelocator__.getCSSReport(selector, { properties }).",
        inputSchema: getCssReportSchema.shape,
      },
      async (args, extra) => this.runBridgeCommand("get_css_report", args, extra)
    );

    this.server.registerTool(
      "treelocator_take_snapshot",
      {
        title: "Capture element style snapshot",
        description:
          "Capture the computed styles of an element and persist them under `snapshotId` (survives reloads). Later call treelocator_get_snapshot_diff with the same id to see what changed. The baseline is immutable until you call take_snapshot again with the same id.",
        inputSchema: takeSnapshotSchema.shape,
      },
      async (args, extra) => this.runBridgeCommand("take_snapshot", args, extra)
    );

    this.server.registerTool(
      "treelocator_get_snapshot_diff",
      {
        title: "Diff element against stored snapshot",
        description:
          "Read the current computed styles of the element stored under `snapshotId` and return the diff against the baseline. Does not overwrite the baseline.",
        inputSchema: snapshotIdSchema.shape,
      },
      async (args, extra) =>
        this.runBridgeCommand("get_snapshot_diff", args, extra)
    );

    this.server.registerTool(
      "treelocator_clear_snapshot",
      {
        title: "Clear stored snapshot",
        description: "Remove the baseline snapshot stored under `snapshotId`.",
        inputSchema: snapshotIdSchema.shape,
      },
      async (args, extra) =>
        this.runBridgeCommand("clear_snapshot", args, extra)
    );

    this.server.registerTool(
      "treelocator_click",
      {
        title: "Click element",
        description: "Click a target element on the active page by selector/index.",
        inputSchema: selectorSchema.shape,
      },
      async (args, extra) => this.runBridgeCommand("click", args, extra)
    );

    this.server.registerTool(
      "treelocator_hover",
      {
        title: "Hover element",
        description: "Hover a target element on the active page by selector/index.",
        inputSchema: selectorSchema.shape,
      },
      async (args, extra) => this.runBridgeCommand("hover", args, extra)
    );

    this.server.registerTool(
      "treelocator_type",
      {
        title: "Type text",
        description: "Type text into an input/textarea/contenteditable element.",
        inputSchema: typeSchema.shape,
      },
      async (args, extra) => this.runBridgeCommand("type", args, extra)
    );

    this.server.registerTool(
      "treelocator_execute_js",
      {
        title: "Execute JavaScript",
        description:
          "Execute arbitrary JavaScript in the active page. The code runs as an async function body — you can use `await` and `return` at the top level. Returns the serialized return value.",
        inputSchema: executeJsSchema.shape,
      },
      async (args, extra) => this.runBridgeCommand("execute_js", args, extra)
    );

    this.server.registerTool(
      "treelocator_get_console",
      {
        title: "Get console output",
        description:
          "Return captured console entries (log/info/warn/error/debug) from the active page. Use `last` to limit to the most recent N entries (default 50, max 500).",
        inputSchema: getConsoleSchema.shape,
      },
      async (args, extra) => this.runBridgeCommand("get_console", args, extra)
    );
  }
}
