import reactAdapter from "./react/reactAdapter";
import jsxAdapter from "./jsx/jsxAdapter";
import svelteAdapter from "./svelte/svelteAdapter";
import vueAdapter from "./vue/vueAdapter";
import type { AdapterObject } from "./adapterApi";
import type { AdapterId } from "../consts";
import { detectFramework } from "./detectFramework";

const adapterMap: Record<AdapterId, AdapterObject> = {
  react: reactAdapter,
  svelte: svelteAdapter,
  vue: vueAdapter,
  jsx: jsxAdapter,
};

/**
 * Resolve the framework adapter to use.
 * If an explicit adapterId is given, return that adapter.
 * Otherwise, auto-detect the framework.
 */
export function resolveAdapter(adapterId?: AdapterId): AdapterObject | null {
  if (adapterId) {
    return adapterMap[adapterId] ?? null;
  }

  const framework = detectFramework();
  return framework ? (adapterMap[framework] ?? null) : null;
}
