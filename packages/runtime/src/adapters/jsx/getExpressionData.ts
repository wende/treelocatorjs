import type { ExpressionInfo, FileStorage } from "@locator/shared";
import { parseDataId, parseDataPath } from "../../functions/parseDataId";

export function getExpressionData(
  target: Element,
  fileData: FileStorage | null
): ExpressionInfo | null {
  // Use getAttribute instead of dataset to support both HTML and SVG elements
  const dataLocatorjs = target.getAttribute("data-locatorjs");
  const dataLocatorjsId = target.getAttribute("data-locatorjs-id");

  // First check for data-locatorjs (path-based, for server components)
  if (dataLocatorjs) {
    const parsed = parseDataPath(dataLocatorjs);
    if (parsed) {
      const [, line, column] = parsed;

      // Try to find in fileData if available
      if (fileData) {
        const expData = fileData.expressions.find(
          (exp) =>
            exp.loc.start.line === line && exp.loc.start.column === column
        );
        if (expData) {
          return expData;
        }
      }

      // If no fileData or not found, create minimal ExpressionInfo from path
      return {
        name: target.tagName.toLowerCase(),
        loc: {
          start: { line, column },
          end: { line, column },
        },
        wrappingComponentId: null,
      };
    }
  }

  // Fall back to data-locatorjs-id (ID-based, traditional approach)
  if (dataLocatorjsId && fileData) {
    const [, id] = parseDataId(dataLocatorjsId);
    const expData = fileData.expressions[Number(id)];
    if (expData) {
      return expData;
    }
  }

  return null;
}
