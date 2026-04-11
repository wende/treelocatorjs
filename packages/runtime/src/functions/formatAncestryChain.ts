import { TreeNode, TreeNodeComponent, TreeNodeElement } from "../types/TreeNode";
import { ServerComponentInfo } from "../types/ServerComponentInfo";
import { parsePhoenixServerComponents } from "../adapters/phoenix/parsePhoenixComments";
import { parseNextjsServerComponents } from "../adapters/nextjs/parseNextjsDataAttributes";
import { normalizeFilePath } from "./normalizeFilePath";

export interface OwnerComponentInfo {
  name: string;
  filePath?: string;
  line?: number;
}

export interface AncestryItem {
  elementName: string;
  componentName?: string;
  filePath?: string;
  line?: number;
  id?: string;
  classes?: string[];
  nthChild?: number; // 1-indexed, only set when there are ambiguous siblings
  /** All owner components from outermost (Sidebar) to innermost (GlassPanel) */
  ownerComponents?: OwnerComponentInfo[];
  /** Server-side components (Phoenix LiveView, Rails, Next.js RSC, etc.) */
  serverComponents?: ServerComponentInfo[];
}

// Elements to exclude from ancestry (not useful for debugging)
const EXCLUDED_ELEMENTS = new Set(["html", "body", "head"]);

function isTreeNodeElement(node: TreeNode): node is TreeNodeElement {
  return "getElement" in node && typeof node.getElement === "function";
}

/**
 * Calculate nth-child position if there are multiple siblings of the same type.
 * Returns undefined if the element is unique among its siblings, or 1-indexed position otherwise.
 */
function getNthChildIfAmbiguous(element: Element): number | undefined {
  const parent = element.parentElement;
  if (!parent) return undefined;

  const tagName = element.tagName;
  const siblings = Array.from(parent.children).filter(
    (child) => child.tagName === tagName
  );

  // Only return position if there are multiple siblings of the same type
  if (siblings.length <= 1) return undefined;

  const index = siblings.indexOf(element);
  return index + 1; // 1-indexed for CSS nth-child compatibility
}

function treeNodeComponentToOwnerInfo(
  comp: TreeNodeComponent
): OwnerComponentInfo {
  return {
    name: comp.label,
    filePath: comp.callLink?.fileName ? normalizeFilePath(comp.callLink.fileName) : undefined,
    line: comp.callLink?.lineNumber,
  };
}

/**
 * Build a short label for the innermost (clicked) element in an ancestry array.
 * Used as the header for computed-style extraction output.
 *
 * Example: `"Button at src/components/Button.tsx:23"` or `"div"` as a fallback.
 */
export function getElementLabel(ancestry: AncestryItem[]): string {
  if (ancestry.length === 0) return "";
  const item = ancestry[0]!;
  const name = item.componentName || item.elementName;
  const location = item.filePath ? ` at ${item.filePath}:${item.line}` : "";
  return `${name}${location}`;
}

export function collectAncestry(node: TreeNode): AncestryItem[] {
  const items: AncestryItem[] = [];
  let current: TreeNode | null = node;

  while (current) {
    // Skip html, body, head elements
    if (EXCLUDED_ELEMENTS.has(current.name)) {
      current = current.getParent();
      continue;
    }

    const source = current.getSource();

    const item: AncestryItem = {
      elementName: current.name,
    };

    // Extract ID and nth-child from the DOM element if available
    if (isTreeNodeElement(current)) {
      const element = current.getElement();
      if (element instanceof Element) {
        if (element.id) {
          item.id = element.id;
        }
        if (element.classList.length > 0) {
          item.classes = Array.from(element.classList);
        }
        const nthChild = getNthChildIfAmbiguous(element);
        if (nthChild !== undefined) {
          item.nthChild = nthChild;
        }

        // Parse server components from various sources
        // 1. Phoenix LiveView (HTML comments)
        const phoenixComponents = parsePhoenixServerComponents(element);

        // 2. Next.js Server Components (data-locatorjs attributes)
        const nextjsComponents = parseNextjsServerComponents(element);

        // Combine all server components
        const allServerComponents = [
          ...(phoenixComponents || []),
          ...(nextjsComponents || []),
        ];

        if (allServerComponents.length > 0) {
          item.serverComponents = allServerComponents;
        }
      }
    }

    // Get all owner components (from outermost like Sidebar to innermost like GlassPanel)
    const ownerComponents = current.getOwnerComponents();
    const outermost = ownerComponents[0];
    if (outermost) {
      item.ownerComponents = ownerComponents.map(treeNodeComponentToOwnerInfo);
      // Use outermost component as the primary component name
      item.componentName = outermost.label;
      if (outermost.callLink) {
        item.filePath = normalizeFilePath(outermost.callLink.fileName);
        item.line = outermost.callLink.lineNumber;
      }
    } else {
      // Fallback to single component if getOwnerComponents not available
      const component = current.getComponent();
      if (component) {
        item.componentName = component.label;
        if (component.callLink) {
          item.filePath = normalizeFilePath(component.callLink.fileName);
          item.line = component.callLink.lineNumber;
        }
      }
    }

    if (!item.filePath && source) {
      item.filePath = normalizeFilePath(source.fileName);
      item.line = source.lineNumber;
    }

    // Only include items that have useful info (component name, file path, or server components)
    if (item.componentName || item.filePath || item.serverComponents) {
      items.push(item);
    }

    current = current.getParent();
  }

  return items;
}

function getInnermostNamedComponent(item: AncestryItem | null | undefined): string | undefined {
  if (!item) return undefined;
  if (item.ownerComponents && item.ownerComponents.length > 0) {
    // Find the innermost non-Anonymous component
    for (let i = item.ownerComponents.length - 1; i >= 0; i--) {
      if (item.ownerComponents[i]!.name !== "Anonymous") {
        return item.ownerComponents[i]!.name;
      }
    }
  }
  // Fall back to componentName if it's not Anonymous
  if (item.componentName && item.componentName !== "Anonymous") {
    return item.componentName;
  }
  return undefined;
}

/**
 * Get the effective file path from an AncestryItem, checking both
 * client filePath and serverComponents (Next.js RSC, Phoenix, etc.).
 */
function getItemFilePath(item: AncestryItem): string | undefined {
  if (item.filePath) return item.filePath;
  if (item.serverComponents && item.serverComponents.length > 0) {
    const comp = item.serverComponents.find((sc) => sc.type === "component");
    if (comp) return comp.filePath;
    return item.serverComponents[0]!.filePath;
  }
  return undefined;
}

/**
 * Truncate ancestry to keep only the local context.
 * - If the clicked element has no file: keep up to the first ancestor with a file.
 * - If the clicked element has a file: keep up to the first ancestor with a DIFFERENT file.
 * Checks both client filePath and serverComponents for file info.
 * The ancestry array is bottom-up: index 0 = clicked element, last = root.
 */
export function truncateAtFirstFile(items: AncestryItem[]): AncestryItem[] {
  if (items.length === 0) return items;

  const clickedFile = getItemFilePath(items[0]!);

  if (!clickedFile) {
    // Clicked element has no file: find first ancestor with any file
    const firstWithFile = items.findIndex((item) => getItemFilePath(item));
    if (firstWithFile === -1) return items;
    return items.slice(0, firstWithFile + 1);
  }

  // Clicked element has a file: find first ancestor with a different file
  for (let i = 1; i < items.length; i++) {
    const ancestorFile = getItemFilePath(items[i]!);
    if (ancestorFile && ancestorFile !== clickedFile) {
      return items.slice(0, i + 1);
    }
  }

  return items;
}

export function formatAncestryChain(items: AncestryItem[]): string {
  if (items.length === 0) {
    return "";
  }

  // Reverse so root is at top, clicked element at bottom
  const reversed = [...items].reverse();

  const lines: string[] = [];

  reversed.forEach((item, index) => {
    const indent = "    ".repeat(index);
    const prefix = index === 0 ? "" : "└─ ";

    // Get the previous item's component to detect component boundaries
    // Ignore "Anonymous" when resolving component names — these are framework internals
    const prevItem = index > 0 ? reversed[index - 1] : null;
    const prevComponentName = getInnermostNamedComponent(prevItem);

    // Get current item's innermost named component
    const currentComponentName = getInnermostNamedComponent(item);

    // Determine the display name for the element
    // Use component name ONLY when crossing a component boundary (root element of a component)
    // This prevents "App -> App:nth-child(5)" when both are just elements inside App
    let displayName = item.elementName;
    let outerComponents: string[] = [];
    const isComponentBoundary = currentComponentName && currentComponentName !== prevComponentName;

    if (isComponentBoundary) {
      if (item.ownerComponents && item.ownerComponents.length > 0) {
        // Use innermost named component as display name, show outer ones in "in X > Y"
        // Filter out "Anonymous" components — these are framework-internal wrappers
        // (e.g. Next.js App Router) that add noise without useful context
        const named = item.ownerComponents.filter((c) => c.name !== "Anonymous");
        const innermost = named[named.length - 1];
        if (innermost) {
          displayName = innermost.name;
          // Outer components (excluding innermost)
          outerComponents = named.slice(0, -1).map((c) => c.name);
        }
      } else if (item.componentName && item.componentName !== "Anonymous") {
        displayName = item.componentName;
      }
    }

    // Build element selector: displayName:nth-child(n)#id.class1.class2
    let selector = displayName;
    if (item.nthChild !== undefined) {
      selector += `:nth-child(${item.nthChild})`;
    }
    if (item.id) {
      selector += `#${item.id}`;
    }
    if (item.classes && item.classes.length > 0) {
      selector += "." + item.classes.join(".");
    }

    let description = selector;

    // Build component description parts
    const parts: string[] = [];

    // Server components (Phoenix/Next.js/Rails/etc.)
    if (item.serverComponents && item.serverComponents.length > 0) {
      // Group server components by framework (detected by file extension)
      const phoenixComponents = item.serverComponents.filter((sc) =>
        sc.filePath.match(/\.(ex|exs|heex)$/)
      );
      const nextjsComponents = item.serverComponents.filter((sc) =>
        sc.filePath.match(/\.(tsx?|jsx?)$/)
      );

      // Format Phoenix components
      if (phoenixComponents.length > 0) {
        const names = phoenixComponents
          .filter((sc) => sc.type === "component")
          .map((sc) => sc.name);
        if (names.length > 0) {
          parts.push(`[Phoenix: ${names.join(" > ")}]`);
        }
      }

      // Format Next.js components
      if (nextjsComponents.length > 0) {
        const names = nextjsComponents
          .filter((sc) => sc.type === "component")
          .map((sc) => sc.name);
        if (names.length > 0) {
          parts.push(`[Next.js: ${names.join(" > ")}]`);
        }
      }
    }

    // Client components - show outer components for context (if any)
    if (outerComponents.length > 0) {
      parts.push(`in ${outerComponents.join(" > ")}`);
    }

    if (parts.length > 0) {
      description = `${selector} ${parts.join(" ")}`;
    }

    // Build location string
    const locationParts: string[] = [];

    // Server component locations
    if (item.serverComponents && item.serverComponents.length > 0) {
      item.serverComponents.forEach((sc) => {
        const prefix = sc.type === "caller" ? " (called from)" : "";
        locationParts.push(`${sc.filePath}:${sc.line}${prefix}`);
      });
    }

    // Client component location (only add if different from server components)
    if (item.filePath) {
      const clientLocation = `${item.filePath}:${item.line}`;
      // Only add if this location isn't already in the list
      if (!locationParts.includes(clientLocation)) {
        locationParts.push(clientLocation);
      }
    }

    const location = locationParts.length > 0 ? ` at ${locationParts.join(", ")}` : "";

    lines.push(`${indent}${prefix}${description}${location}`);
  });

  return lines.join("\n");
}
