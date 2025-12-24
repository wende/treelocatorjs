import { parsePhoenixServerComponents } from "../adapters/phoenix/parsePhoenixComments";
// Elements to exclude from ancestry (not useful for debugging)
const EXCLUDED_ELEMENTS = new Set(["html", "body", "head"]);
function isTreeNodeElement(node) {
  return "getElement" in node && typeof node.getElement === "function";
}

/**
 * Calculate nth-child position if there are multiple siblings of the same type.
 * Returns undefined if the element is unique among its siblings, or 1-indexed position otherwise.
 */
function getNthChildIfAmbiguous(element) {
  const parent = element.parentElement;
  if (!parent) return undefined;
  const tagName = element.tagName;
  const siblings = Array.from(parent.children).filter(child => child.tagName === tagName);

  // Only return position if there are multiple siblings of the same type
  if (siblings.length <= 1) return undefined;
  const index = siblings.indexOf(element);
  return index + 1; // 1-indexed for CSS nth-child compatibility
}
function treeNodeComponentToOwnerInfo(comp) {
  return {
    name: comp.label,
    filePath: comp.callLink?.fileName,
    line: comp.callLink?.lineNumber
  };
}
export function collectAncestry(node) {
  const items = [];
  let current = node;
  while (current) {
    // Skip html, body, head elements
    if (EXCLUDED_ELEMENTS.has(current.name)) {
      current = current.getParent();
      continue;
    }
    const source = current.getSource();
    const item = {
      elementName: current.name
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

        // Parse Phoenix server components from HTML comments
        const serverComponents = parsePhoenixServerComponents(element);
        if (serverComponents && serverComponents.length > 0) {
          item.serverComponents = serverComponents;
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
        item.filePath = outermost.callLink.fileName;
        item.line = outermost.callLink.lineNumber;
      }
    } else {
      // Fallback to single component if getOwnerComponents not available
      const component = current.getComponent();
      if (component) {
        item.componentName = component.label;
        if (component.callLink) {
          item.filePath = component.callLink.fileName;
          item.line = component.callLink.lineNumber;
        }
      }
    }
    if (!item.filePath && source) {
      item.filePath = source.fileName;
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
export function formatAncestryChain(items) {
  if (items.length === 0) {
    return "";
  }

  // Reverse so root is at top, clicked element at bottom
  const reversed = [...items].reverse();
  const lines = [];
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

    // Build component description parts
    const parts = [];

    // Server components (Phoenix/Rails/etc.)
    if (item.serverComponents && item.serverComponents.length > 0) {
      const phoenixComponents = item.serverComponents.filter(sc => sc.type === "component").map(sc => sc.name);
      if (phoenixComponents.length > 0) {
        parts.push(`[Phoenix: ${phoenixComponents.join(" > ")}]`);
      }
    }

    // Client components (React/Vue/etc.)
    if (item.ownerComponents && item.ownerComponents.length > 0) {
      const componentChain = item.ownerComponents.map(c => c.name).join(" > ");
      parts.push(`in ${componentChain}`);
    } else if (item.componentName) {
      parts.push(`in ${item.componentName}`);
    }
    if (parts.length > 0) {
      description = `${selector} ${parts.join(" ")}`;
    }

    // Build location string
    const locationParts = [];

    // Server component locations
    if (item.serverComponents && item.serverComponents.length > 0) {
      item.serverComponents.forEach(sc => {
        const prefix = sc.type === "caller" ? " (called from)" : "";
        locationParts.push(`${sc.filePath}:${sc.line}${prefix}`);
      });
    }

    // Client component location
    if (item.filePath) {
      locationParts.push(`${item.filePath}:${item.line}`);
    }
    const location = locationParts.length > 0 ? ` at ${locationParts.join(", ")}` : "";
    lines.push(`${indent}${prefix}${description}${location}`);
  });
  return lines.join("\n");
}