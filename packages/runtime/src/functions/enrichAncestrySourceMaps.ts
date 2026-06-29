import { AncestryItem } from "./formatAncestryChain";
import { resolveSourceLocation, parseDebugStack } from "../adapters/react/resolveSourceMap";
import {
  getReactFiberFromElement,
  React19Fiber,
} from "../adapters/react/reactFiberUtils";
import { normalizeFilePath } from "./normalizeFilePath";

/**
 * Check if any DOM element has React 19 fibers (with _debugStack instead of _debugSource).
 * Must walk the _debugOwner chain because DOM element fibers (HostComponent) never have
 * _debugStack — only function component fibers do.
 */
function isReact19Environment(): boolean {
  const el = document.querySelector("[class]") || document.body;
  if (!el) return false;

  let fiber = getReactFiberFromElement<React19Fiber>(el);
  while (fiber) {
    if (fiber._debugSource) return false; // React 18
    if (fiber._debugStack) return true; // React 19
    fiber = fiber._debugOwner || null;
  }
  return false;
}

/**
 * Walk a fiber's _debugOwner chain and collect _debugStack stack traces for each component.
 * Returns a map from component name to its parsed stack location.
 */
function collectFiberStacks(
  element: HTMLElement
): Map<string, { url: string; line: number; column: number }> {
  const stacks = new Map<string, { url: string; line: number; column: number }>();

  let fiber = getReactFiberFromElement<React19Fiber>(element);

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
