import { TreeNode, TreeNodeElement } from "../types/TreeNode";

export interface AncestryItem {
  elementName: string;
  componentName?: string;
  filePath?: string;
  line?: number;
  id?: string;
  nthChild?: number; // 1-indexed, only set when there are ambiguous siblings
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

export function collectAncestry(node: TreeNode): AncestryItem[] {
  const items: AncestryItem[] = [];
  let current: TreeNode | null = node;

  while (current) {
    // Skip html, body, head elements
    if (EXCLUDED_ELEMENTS.has(current.name)) {
      current = current.getParent();
      continue;
    }

    const component = current.getComponent();
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
        const nthChild = getNthChildIfAmbiguous(element);
        if (nthChild !== undefined) {
          item.nthChild = nthChild;
        }
      }
    }

    if (component) {
      item.componentName = component.label;
      if (component.callLink) {
        item.filePath = component.callLink.fileName;
        item.line = component.callLink.lineNumber;
      }
    }

    if (!item.filePath && source) {
      item.filePath = source.fileName;
      item.line = source.lineNumber;
    }

    // Only include items that have useful info (component name or file path)
    if (item.componentName || item.filePath) {
      items.push(item);
    }

    current = current.getParent();
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

    // Build element selector: elementName:nth-child(n)#id
    let selector = item.elementName;
    if (item.nthChild !== undefined) {
      selector += `:nth-child(${item.nthChild})`;
    }
    if (item.id) {
      selector += `#${item.id}`;
    }

    let description = selector;
    if (item.componentName) {
      description = `${selector} in ${item.componentName}`;
    }

    const location = item.filePath ? ` at ${item.filePath}:${item.line}` : "";

    lines.push(`${indent}${prefix}${description}${location}`);
  });

  return lines.join("\n");
}
