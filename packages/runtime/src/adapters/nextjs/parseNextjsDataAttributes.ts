import { ServerComponentInfo } from "../../types/ServerComponentInfo";
import { normalizeFilePath } from "../../functions/normalizeFilePath";

/**
 * Parse Next.js server component data from data-locatorjs attribute.
 *
 * Format: data-locatorjs="/path/to/app/layout.tsx:27:4"
 *
 * The @treelocator/webpack-loader adds these attributes to elements
 * rendered by Next.js Server Components.
 */

/**
 * Extract component name from file path.
 * Examples:
 *   - "/apps/next-16/app/layout.tsx:27:4" → "RootLayout"
 *   - "/apps/next-16/app/page.tsx:5:4" → "Home"
 *   - "/apps/next-16/app/components/Header.tsx:10:2" → "Header"
 */
function extractComponentName(filePath: string): string {
  // Remove line:column suffix
  const pathOnly = filePath.split(":")[0] || filePath;

  // Get filename without extension
  const fileName = pathOnly.split("/").pop()?.replace(/\.(tsx?|jsx?)$/, "") || "Unknown";

  // Common Next.js conventions:
  // - "layout" → "RootLayout" or "Layout"
  // - "page" → Component name (we don't know it, so use "Page")
  // - Others → Use as-is
  if (fileName === "layout") {
    return "RootLayout";
  } else if (fileName === "page") {
    return "Page";
  }

  return fileName;
}

/**
 * Parse a data-locatorjs attribute value.
 * Format: "/path/to/file.tsx:line:column"
 * Returns ServerComponentInfo or null if parsing fails.
 */
function parseDataLocatorjsValue(value: string): ServerComponentInfo | null {
  if (!value) return null;

  // Split by ":" to get [filePath, line, column]
  const parts = value.split(":");
  if (parts.length < 2) return null;

  // Last two parts are column and line (in reverse order)
  const column = parts.pop();
  const line = parts.pop();

  // Everything else is the file path (which may contain colons on Windows)
  const filePath = parts.join(":");

  if (!filePath || !line) return null;

  const componentName = extractComponentName(filePath);
  const normalizedPath = normalizeFilePath(filePath);

  return {
    name: componentName,
    filePath: normalizedPath,
    line: parseInt(line, 10),
    type: "component",
  };
}

/**
 * Get the data-locatorjs attribute from the current element only.
 * Returns array with single component info, or empty array if not found.
 *
 * We only look at the current element because the tree structure already
 * shows the hierarchy - each parent element will have its own server component.
 *
 * Example DOM:
 * ```html
 * <html data-locatorjs="/app/layout.tsx:27:4">        <!-- RootLayout -->
 *   <body data-locatorjs="/app/layout.tsx:28:6">      <!-- RootLayout -->
 *     <div data-locatorjs="/app/page.tsx:5:4">        <!-- Page -->
 *       <button>Click</button>
 *     </div>
 *   </body>
 * </html>
 * ```
 *
 * For the div, returns: [{ name: "Page", filePath: "/app/page.tsx", line: 5 }]
 * The tree structure will show: html (RootLayout) > body (RootLayout) > div (Page)
 */
export function collectNextjsServerComponents(element: Element): ServerComponentInfo[] {
  const value = element.getAttribute("data-locatorjs");
  if (!value) return [];

  const info = parseDataLocatorjsValue(value);
  return info ? [info] : [];
}

/**
 * Main entry point: extract Next.js server component info from element.
 * Returns null if no data-locatorjs attribute found.
 *
 * This function is called during ancestry collection to enrich each AncestryItem
 * with server-side Next.js component information.
 */
export function parseNextjsServerComponents(element: Element): ServerComponentInfo[] | null {
  const components = collectNextjsServerComponents(element);
  if (components.length === 0) return null;
  return components;
}
