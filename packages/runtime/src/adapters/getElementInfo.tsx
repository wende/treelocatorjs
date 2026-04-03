import { AdapterId } from "../consts";
import { resolveAdapter } from "./resolveAdapter";

export function getElementInfo(target: HTMLElement, adapterId?: AdapterId) {
  const adapter = resolveAdapter(adapterId);
  return adapter?.getElementInfo(target) ?? null;
}
