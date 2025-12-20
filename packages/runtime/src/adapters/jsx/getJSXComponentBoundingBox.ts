import type { FileStorage } from "@locator/shared";
import { mergeRects } from "../../functions/mergeRects";
import { parseDataId, parseDataPath } from "../../functions/parseDataId";
import type { SimpleDOMRect } from "../../types/types";
import { getExpressionData } from "./getExpressionData";

export function getJSXComponentBoundingBox(
  found: Element,
  locatorData: { [filename: string]: FileStorage },
  componentFolder: string,
  componentId: number
): SimpleDOMRect {
  let composedBox: SimpleDOMRect = found.getBoundingClientRect();
  // Currently it works well only for components with one root element, but for components with multiple root elements we would need to track instance ids.
  function goParent(current: Element) {
    const parent = current.parentNode;
    if (!parent) {
      return;
    }
    // Support both HTMLElement and SVGElement
    if (parent instanceof HTMLElement || parent instanceof SVGElement) {
      // Use getAttribute instead of dataset to support both HTML and SVG elements
      const dataLocatorjs = parent.getAttribute("data-locatorjs");
      const dataLocatorjsId = parent.getAttribute("data-locatorjs-id");

      // Check for either data-locatorjs (path-based) or data-locatorjs-id (ID-based)
      if (dataLocatorjs || dataLocatorjsId) {
        let fileFullPath: string;

        if (dataLocatorjs) {
          const parsed = parseDataPath(dataLocatorjs);
          if (!parsed) {
            goParent(parent);
            return;
          }
          [fileFullPath] = parsed;
        } else if (dataLocatorjsId) {
          [fileFullPath] = parseDataId(dataLocatorjsId);
        } else {
          goParent(parent);
          return;
        }

        const fileData: FileStorage | undefined = locatorData[fileFullPath];
        const expData = getExpressionData(parent, fileData || null);
        if (expData) {
          if (
            expData.wrappingComponentId === componentId &&
            componentFolder === fileFullPath
          ) {
            composedBox = mergeRects(
              composedBox,
              parent.getBoundingClientRect()
            );
            goParent(parent);
          }
          expData.wrappingComponentId;
        }
      } else {
        // If there is no locatorjs-id or locatorjs, we should go to the parent, because it can be some library element
        goParent(parent);
      }
    }
  }
  goParent(found);

  return composedBox;
}
