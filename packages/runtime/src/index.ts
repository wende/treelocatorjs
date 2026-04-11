import { Target } from "@locator/shared";
import { AdapterId } from "./consts";
import { initRuntime } from "./initRuntime";
import type { MCPBridgeConfig } from "./mcpBridge";
export * from "./adapters/jsx/runtimeStore";

export const MAX_ZINDEX = 2147483647;

export interface SetupOptions {
  adapter?: AdapterId;
  targets?: { [k: string]: Target | string };
  mcp?: MCPBridgeConfig;
}

export function setup({
  adapter,
  targets,
  mcp,
}: SetupOptions = {}) {
  setTimeout(() => initRuntime({ adapter, targets, mcp }), 0);
}

export default setup;
