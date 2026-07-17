/**
 * Transient visual highlight for matched `queryBySource` elements.
 *
 * `Outline.tsx` is too coupled to the overlay tree to reuse here, so this
 * is a small standalone helper: build a Shadow-DOM-isolated wrapper of
 * fixed-positioned outline boxes, attach to the page, auto-remove after
 * `durationMs`. Returns the number of elements highlighted.
 */

import type { SourceMatch } from "./queryBySource";

const HIGHLIGHT_CLASS = "__treelocator_highlight__";
const DEFAULT_DURATION_MS = 3000;

interface HighlightHandle {
  count: number;
  /** Cancel the auto-remove timer early (e.g. agent wants to inspect longer). */
  cancel: () => void;
}

/**
 * Draw outlines around each match for `durationMs`. Safe to call repeatedly;
 * each call gets its own overlay host so concurrent highlights don't collide.
 */
export function highlightMatches(
  matches: SourceMatch[],
  durationMs: number = DEFAULT_DURATION_MS
): HighlightHandle {
  if (matches.length === 0 || typeof document === "undefined") {
    return { count: 0, cancel: () => undefined };
  }

  const host = document.createElement("div");
  host.className = HIGHLIGHT_CLASS;
  host.setAttribute("data-treelocator-highlight", "true");
  // Prevent the host from being a layout root: it sits outside the DOM tree
  // in a way that doesn't disrupt the page. We use fixed positioning for
  // each child rather than the host itself.
  host.style.position = "absolute";
  host.style.top = "0";
  host.style.left = "0";
  host.style.width = "0";
  host.style.height = "0";
  host.style.pointerEvents = "none";
  host.style.zIndex = "2147483646";

  // Use Shadow DOM to keep our outline CSS from clashing with page styles.
  const shadow = host.attachShadow({ mode: "open" });
  const style = document.createElement("style");
  style.textContent = `
    :host { all: initial; }
    .outline {
      position: fixed;
      pointer-events: none;
      box-sizing: border-box;
      border: 2px solid #0ea5e9;
      border-radius: 3px;
      box-shadow: 0 0 0 1px rgba(15, 23, 42, 0.6), 0 4px 16px rgba(14, 165, 233, 0.35);
      transition: opacity 200ms ease-out;
    }
    .pulse { animation: treelocator-pulse 800ms ease-in-out 2; }
    @keyframes treelocator-pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.35; }
    }
  `;
  shadow.appendChild(style);

  let count = 0;
  for (const match of matches) {
    const el = document.querySelector(match.selector);
    if (!el) continue;
    const rect = (el as HTMLElement).getBoundingClientRect();
    const outline = document.createElement("div");
    outline.className = "outline pulse";
    outline.style.left = `${rect.left}px`;
    outline.style.top = `${rect.top}px`;
    outline.style.width = `${rect.width}px`;
    outline.style.height = `${rect.height}px`;
    shadow.appendChild(outline);
    count++;
  }

  if (count === 0) {
    return { count: 0, cancel: () => undefined };
  }

  document.body.appendChild(host);

  const remove = () => {
    if (host.parentNode) host.parentNode.removeChild(host);
  };

  const timer = window.setTimeout(remove, durationMs);

  return {
    count,
    cancel: () => {
      window.clearTimeout(timer);
      remove();
    },
  };
}