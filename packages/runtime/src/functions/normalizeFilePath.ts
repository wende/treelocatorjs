/**
 * Convert absolute file paths to relative paths for display.
 *
 * This ensures consistent path display across different sources:
 * - React _debugSource may provide absolute paths
 * - Next.js data-locatorjs attributes may have absolute paths
 * - Phoenix comments use relative paths
 *
 * Examples:
 *   - "/Users/name/project/src/App.tsx" → "src/App.tsx"
 *   - "/workspace/apps/next-16/app/page.tsx" → "app/page.tsx"
 *   - "src/components/Button.tsx" → "src/components/Button.tsx" (unchanged)
 */
export function normalizeFilePath(filePath: string): string {
  // If it's already relative (doesn't start with /), return as-is
  if (!filePath.startsWith("/")) {
    return filePath;
  }

  // Find common project indicators to trim the path
  const indicators = ["/app/", "/src/", "/pages/", "/components/", "/lib/"];

  for (const indicator of indicators) {
    const index = filePath.indexOf(indicator);
    if (index !== -1) {
      // Return from the indicator onwards (remove leading slash)
      return filePath.substring(index + 1);
    }
  }

  // If no indicator found, try to get just the last few path segments
  const parts = filePath.split("/");

  // Return last 3-4 segments if available (e.g., "apps/next-16/app/page.tsx")
  if (parts.length > 3) {
    return parts.slice(-4).join("/");
  }

  // Last resort: return as-is
  return filePath;
}
