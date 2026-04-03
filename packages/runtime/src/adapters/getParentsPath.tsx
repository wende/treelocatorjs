import { ParentPathItem } from "./adapterApi";
import { resolveAdapter } from "./resolveAdapter";

export function getParentsPaths(
  target: HTMLElement,
  adapterId?: string
): ParentPathItem[] {
  const adapter = resolveAdapter(adapterId as any);
  return adapter?.getParentsPaths(target) ?? [];
}
