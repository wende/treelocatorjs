import type { FileStorage } from "@locator/shared";
import {
  parseDataId,
  parseDataPath,
  splitFullPath,
} from "../../functions/parseDataId";
import type { TreeNodeComponent } from "../../types/TreeNode";
import type { Source } from "../../types/types";
import type { AdapterObject, FullElementInfo } from "../adapterApi";
import { HtmlElementTreeNode } from "../HtmlElementTreeNode";
import {
  LOCATORJS_ID_ATTR,
  LOCATORJS_PATH_ATTR,
  LOCATORJS_SELECTOR,
} from "../../consts";
import { getExpressionData } from "./getExpressionData";
import { getJSXComponentBoundingBox } from "./getJSXComponentBoundingBox";

type JSXLocatorData = {
  fileFullPath: string;
  fileData: FileStorage | undefined;
  filePath: string;
  projectPath: string;
};

function resolveJSXLocatorData(element: Element): JSXLocatorData | null {
  const dataId = element.getAttribute(LOCATORJS_ID_ATTR);
  const dataPath = element.getAttribute(LOCATORJS_PATH_ATTR);

  if (!dataId && !dataPath) return null;

  let fileFullPath: string;

  if (dataPath) {
    const parsed = parseDataPath(dataPath);
    if (!parsed) return null;
    [fileFullPath] = parsed;
  } else if (dataId) {
    [fileFullPath] = parseDataId(dataId);
  } else {
    return null;
  }

  const locatorData = window.__LOCATOR_DATA__;
  const fileData: FileStorage | undefined = locatorData?.[fileFullPath];

  let filePath: string;
  let projectPath: string;

  if (fileData) {
    filePath = fileData.filePath;
    projectPath = fileData.projectPath;
  } else {
    [projectPath, filePath] = splitFullPath(fileFullPath);
  }

  return { fileFullPath, fileData, filePath, projectPath };
}

export function getElementInfo(target: HTMLElement): FullElementInfo | null {
  const found = target.closest(LOCATORJS_SELECTOR);

  // Support both HTMLElement and SVGElement
  if (
    found &&
    (found instanceof HTMLElement || found instanceof SVGElement)
  ) {
    const resolved = resolveJSXLocatorData(found);
    if (!resolved) {
      return null;
    }

    const { fileFullPath, fileData, filePath, projectPath } = resolved;
    const locatorData = window.__LOCATOR_DATA__;

    // Get expression data (works with or without locatorData)
    const expData = getExpressionData(found, fileData || null);
    if (!expData) {
      return null;
    }

    const wrappingComponent =
      expData.wrappingComponentId !== null && fileData
        ? fileData.components[Number(expData.wrappingComponentId)]
        : null;

    return {
      thisElement: {
        box: found.getBoundingClientRect(),
        label: expData.name,
        link: {
          filePath,
          projectPath,
          column: (expData.loc.start.column || 0) + 1,
          line: expData.loc.start.line || 0,
        },
      },
      htmlElement: found,
      parentElements: [],
      componentBox: getJSXComponentBoundingBox(
        found,
        locatorData || {},
        fileFullPath,
        Number(expData.wrappingComponentId)
      ),
      componentsLabels: wrappingComponent
        ? [
            {
              label: wrappingComponent.name || "component",
              link: {
                filePath,
                projectPath,
                column: (wrappingComponent.loc?.start.column || 0) + 1,
                line: wrappingComponent.loc?.start.line || 0,
              },
            },
          ]
        : [],
    };
  }

  return null;
}

export class JSXTreeNodeElement extends HtmlElementTreeNode {
  getSource(): Source | null {
    const resolved = resolveJSXLocatorData(this.element);
    if (!resolved) return null;

    const { fileData, filePath, projectPath } = resolved;

    // Get expression data (works with or without locatorData)
    const expData = getExpressionData(this.element, fileData || null);
    if (expData) {
      return {
        fileName: filePath,
        projectPath,
        columnNumber: (expData.loc.start.column || 0) + 1,
        lineNumber: expData.loc.start.line || 0,
      };
    }

    return null;
  }
  getComponent(): TreeNodeComponent | null {
    const resolved = resolveJSXLocatorData(this.element);
    if (!resolved) return null;

    const { fileData } = resolved;

    // Component information is only available when we have fileData
    if (fileData) {
      const expData = getExpressionData(this.element, fileData);
      if (expData && expData.wrappingComponentId !== null) {
        const component = fileData.components[expData.wrappingComponentId];
        if (component) {
          return {
            label: component.name || "component",
            definitionLink: {
              fileName: fileData.filePath,
              projectPath: fileData.projectPath,
              columnNumber: (component.loc?.start.column || 0) + 1,
              lineNumber: component.loc?.start.line || 0,
            },
          };
        }
      }
    }

    return null;
  }
}

const jsxAdapter: AdapterObject = {
  getElementInfo,
};

export default jsxAdapter;
