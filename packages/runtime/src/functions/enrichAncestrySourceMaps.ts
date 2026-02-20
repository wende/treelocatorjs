import { AncestryItem } from "./formatAncestryChain";
import { resolveSourceLocation, parseDebugStack } from "../adapters/react/resolveSourceMap";
import { normalizeFilePath } from "./normalizeFilePath";

/**
 * Check if any DOM element has React 19 fibers (with _debugStack instead of _debugSource).
 */
function isReact19Environment(): boolean {
  const el = document.querySelector("[class]") || document.body;
  if (!el) return false;

  const fiberKey = Object.keys(el).find((k) => k.startsWith("__reactFiber$"));
  if (!fiberKey) return false;

  const fiber = (el as any)[fiberKey];
  return !fiber?._debugSource && !!(fiber as any)?._debugStack;
}

/**
 * Walk a fiber's _debugOwner chain and collect _debugStack stack traces for each component.
 * Returns a map from component name to its parsed stack location.
 */
function collectFiberStacks(
  element: HTMLElement
): Map<string, { url: string; line: number; column: number }> {
  const stacks = new Map<string, { url: string; line: number; column: number }>();

  const fiberKey = Object.keys(element).find((k) =>
    k.startsWith("__reactFiber$")
  );
  if (!fiberKey) return stacks;

  let fiber = (element as any)[fiberKey];

  // Collect stacks from the fiber itself and its _debugOwner chain
  while (fiber) {
    const debugStack = fiber._debugStack;
    if (debugStack?.stack) {
      const parsed = parseDebugStack(debugStack.stack);
      if (parsed) {
        const name =
          fiber.type?.name || fiber.type?.displayName || fiber.type;
        if (typeof name === "string") {
          stacks.set(name, parsed);
        }
      }
    }
    fiber = fiber._debugOwner || null;
  }

  return stacks;
}

/**
 * Enrich ancestry items that are missing filePath by resolving via source maps.
 * This is an async operation that fetches source maps for React 19 environments.
 * For React 18 (where _debugSource exists), this is a no-op.
 */
export async function enrichAncestryWithSourceMaps(
  items: AncestryItem[],
  element?: HTMLElement
): Promise<AncestryItem[]> {
  // Skip if all items already have file paths, or not React 19
  const needsEnrichment = items.some((item) => item.componentName && !item.filePath);
  if (!needsEnrichment || !isReact19Environment()) {
    return items;
  }

  // Collect _debugStack info from the DOM element's fiber chain
  const stacks = element ? collectFiberStacks(element) : new Map();

  // Resolve source maps in parallel for items missing filePath
  const enriched = await Promise.all(
    items.map(async (item) => {
      if (item.filePath || !item.componentName) return item;

      // Find the stack trace for this component
      const stack = stacks.get(item.componentName);
      if (!stack) return item;

      try {
        const source = await resolveSourceLocation(
          stack.url,
          stack.line,
          stack.column
        );
        if (source) {
          return {
            ...item,
            filePath: normalizeFilePath(source.fileName),
            line: source.lineNumber,
          };
        }
      } catch {
        // Source map resolution failed — keep item as-is
      }

      return item;
    })
  );

  return enriched;
}
