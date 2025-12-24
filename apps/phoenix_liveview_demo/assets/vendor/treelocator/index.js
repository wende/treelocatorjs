import { initRuntime } from "./initRuntime";
export * from "./adapters/jsx/runtimeStore";
export const MAX_ZINDEX = 2147483647;
export function setup({
  adapter,
  targets
} = {}) {
  setTimeout(() => initRuntime({
    adapter,
    targets
  }), 0);
}
export default setup;