import { TreeNode } from "../types/TreeNode";

export interface AncestryItem {
  elementName: string;
  componentName?: string;
  filePath?: string;
  line?: number;
}

// Elements to exclude from ancestry (not useful for debugging)
const EXCLUDED_ELEMENTS = new Set(["html", "body", "head"]);

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

    let description = item.elementName;
    if (item.componentName) {
      description = `${item.elementName} in ${item.componentName}`;
    }

    const location = item.filePath ? ` at ${item.filePath}:${item.line}` : "";

    lines.push(`${indent}${prefix}${description}${location}`);
  });

  return lines.join("\n");
}
