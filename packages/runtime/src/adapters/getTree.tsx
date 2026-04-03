import { resolveAdapter } from "./resolveAdapter";

export function getTree(target: HTMLElement, adapterId?: string) {
  const adapter = resolveAdapter(adapterId as any);
  return adapter?.getTree?.(target) ?? null;
}
