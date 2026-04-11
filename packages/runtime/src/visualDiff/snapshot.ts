import { getReferenceId } from "../functions/getReferenceId";
import { isLocatorsOwnElement } from "../functions/isLocatorsOwnElement";
import type { ElementSnapshot } from "./types";

export const MAX_SNAPSHOT_ELEMENTS = 2000;
const TEXT_LIMIT = 80;

let warnedOverflow = false;

function truncateText(raw: string | null): string | undefined {
  if (!raw) return undefined;
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  return trimmed.length > TEXT_LIMIT ? trimmed.slice(0, TEXT_LIMIT) : trimmed;
}

function snapshotElement(el: HTMLElement | SVGElement): ElementSnapshot | null {
  const rect = el.getBoundingClientRect();
  const style = getComputedStyle(el);

  const viewportWidth =
    typeof window !== "undefined" ? window.innerWidth : 0;
  const viewportHeight =
    typeof window !== "undefined" ? window.innerHeight : 0;

  const inViewport =
    rect.x + rect.width > 0 &&
    rect.y + rect.height > 0 &&
    rect.x < viewportWidth &&
    rect.y < viewportHeight;

  if (!inViewport) return null;

  const opacity = parseFloat(style.opacity || "1");
  const displayNone = style.display === "none";
  const hidden = style.visibility === "hidden";
  const zeroSize = rect.width <= 0 || rect.height <= 0;
  const visible = !displayNone && !hidden && !zeroSize;

  const rawClasses =
    typeof el.className === "string"
      ? el.className.split(/\s+/).filter(Boolean)
      : Array.from(el.classList);
  const classes = rawClasses.filter((c) => !c.startsWith("locatorjs-"));

  const disabled =
    (el as HTMLInputElement | HTMLButtonElement).disabled === true;

  const hasElementChildren = el.children.length > 0;
  const text = hasElementChildren ? undefined : truncateText(el.textContent);

  return {
    key: String(getReferenceId(el)),
    tagName: el.tagName.toLowerCase(),
    id: el.id || undefined,
    classes,
    x: rect.x,
    y: rect.y,
    width: rect.width,
    height: rect.height,
    visible,
    opacity: Number.isFinite(opacity) ? opacity : 1,
    inViewport,
    pointerEvents: style.pointerEvents || "auto",
    disabled,
    text,
  };
}

export function takeSnapshot(
  root?: HTMLElement | SVGElement | null
): ElementSnapshot[] {
  if (typeof document === "undefined") return [];

  const out: ElementSnapshot[] = [];
  const candidates: Array<HTMLElement | SVGElement> = [];

  if (root) {
    if (root instanceof HTMLElement || root instanceof SVGElement) {
      candidates.push(root);
    }
    const descendants = root.querySelectorAll<HTMLElement | SVGElement>("*");
    for (let i = 0; i < descendants.length; i++) {
      candidates.push(descendants[i]!);
    }
  } else {
    const all = document.querySelectorAll<HTMLElement | SVGElement>("*");
    for (let i = 0; i < all.length; i++) {
      candidates.push(all[i]!);
    }
  }

  for (let i = 0; i < candidates.length; i++) {
    const el = candidates[i]!;
    if (!(el instanceof HTMLElement) && !(el instanceof SVGElement)) continue;
    if (el instanceof HTMLElement && isLocatorsOwnElement(el)) continue;

    const snap = snapshotElement(el);
    if (!snap) continue;
    out.push(snap);

    if (out.length >= MAX_SNAPSHOT_ELEMENTS) {
      if (!warnedOverflow) {
        warnedOverflow = true;
        // eslint-disable-next-line no-console
        console.warn(
          `[treelocator/visualDiff] snapshot capped at ${MAX_SNAPSHOT_ELEMENTS} elements`
        );
      }
      break;
    }
  }

  return out;
}

export function __resetSnapshotWarningForTests(): void {
  warnedOverflow = false;
}
