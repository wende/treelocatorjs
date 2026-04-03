import reactAdapter from "./react/reactAdapter";
import jsxAdapter from "./jsx/jsxAdapter";
import svelteAdapter from "./svelte/svelteAdapter";
import vueAdapter from "./vue/vueAdapter";
import {
  detectJSX,
  detectReact,
  detectSvelte,
  detectVue,
} from "@locator/shared";
import type { AdapterObject } from "./adapterApi";
import type { AdapterId } from "../consts";

const adapterMap: Record<AdapterId, AdapterObject> = {
  react: reactAdapter,
  svelte: svelteAdapter,
  vue: vueAdapter,
  jsx: jsxAdapter,
};

/**
 * Resolve the framework adapter to use.
 * If an explicit adapterId is given, return that adapter.
 * Otherwise, auto-detect the framework in priority order.
 */
export function resolveAdapter(adapterId?: AdapterId): AdapterObject | null {
  if (adapterId) {
    return adapterMap[adapterId] ?? null;
  }

  if (detectSvelte()) return svelteAdapter;
  if (detectVue()) return vueAdapter;
  if (detectReact()) return reactAdapter;
  // Must be last: global data leaks from the LocatorJS extension (SolidJS + JSX plugin in dev)
  if (detectJSX()) return jsxAdapter;

  return null;
}
