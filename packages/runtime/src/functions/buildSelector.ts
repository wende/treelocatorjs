/**
 * Build a CSS selector that uniquely resolves back to `element`.
 *
 * The runtime's ancestry output is for humans; automation tools (and the MCP
 * `query_by_source` caller) need a stable selector they can hand to
 * `get_path` / `click` / `take_snapshot` afterward. This produces the shortest
 * selector that round-trips: `tag`, then `#id` / `.class` modifiers, then
 * `:nth-of-type(n)` pinning, climbing ancestors (bounded) until unique.
 *
 * `CSS.escape` is used so ids/classes containing dots or colons don't break
 * the selector. The result is verified with `document.querySelector` so a
 * unique selector is guaranteed when one is reachable.
 */
function escapeToken(value: string): string {
  if (typeof CSS !== "undefined" && typeof CSS.escape === "function") {
    return CSS.escape(value);
  }
  // Fallback for non-browser/jsdom environments without CSS.escape.
  return value.replace(/([^\w-])/g, "\\$1");
}

function isUniqueMatch(selector: string, element: HTMLElement): boolean {
  try {
    return document.querySelector(selector) === element;
  } catch {
    // Malformed selector — treat as non-unique so we keep refining.
    return false;
  }
}

function nthOfType(element: HTMLElement): number {
  const parent = element.parentElement;
  if (!parent) return 1;
  let position = 1;
  for (const sibling of Array.from(parent.children)) {
    if (sibling === element) return position;
    if (sibling.tagName === element.tagName) position++;
  }
  return position;
}

function elementSelector(element: HTMLElement): string {
  const parts: string[] = [element.tagName.toLowerCase()];
  if (element.id) {
    parts.push(`#${escapeToken(element.id)}`);
  } else {
    // Only add classes when there's no id; an id alone is already unique.
    for (const cls of Array.from(element.classList)) {
      parts.push(`.${escapeToken(cls)}`);
    }
  }
  return parts.join("");
}

export function buildSelector(element: HTMLElement, maxDepth = 4): string {
  // Build bottom-up: the element's own selector, pinned with :nth-of-type,
  // then climb the parent chain until querySelector resolves uniquely.
  let selector = `${elementSelector(element)}:nth-of-type(${nthOfType(element)})`;
  let current: HTMLElement | null = element;
  let depth = 0;

  while (current && !isUniqueMatch(selector, element) && depth < maxDepth) {
    const parent: HTMLElement | null = current.parentElement;
    if (!parent) break;
    const parentSel = `${elementSelector(parent)}:nth-of-type(${nthOfType(parent)})`;
    selector = `${parentSel} > ${selector}`;
    current = parent;
    depth++;
  }

  // Prefer the shorter attribute-only form when it is already unique.
  const short = elementSelector(element);
  if (isUniqueMatch(short, element)) {
    return short;
  }

  return selector;
}
