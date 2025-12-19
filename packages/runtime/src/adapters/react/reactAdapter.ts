import { findDebugSource } from "./findDebugSource";
import { findFiberByHtmlElement } from "./findFiberByHtmlElement";
import { getFiberLabel } from "./getFiberLabel";
import { getAllWrappingParents } from "./getAllWrappingParents";
import { deduplicateLabels } from "../../functions/deduplicateLabels";
import { LabelData } from "../../types/LabelData";
import { getFiberOwnBoundingBox } from "./getFiberOwnBoundingBox";
import { getAllParentsElementsAndRootComponent } from "./getAllParentsElementsAndRootComponent";
import { isStyledElement } from "./isStyled";
import {
  AdapterObject,
  FullElementInfo,
  ParentPathItem,
  TreeState,
} from "../adapterApi";
import { Fiber, Source } from "@locator/shared";
import { TreeNode, TreeNodeComponent } from "../../types/TreeNode";
import { goUpByTheTree } from "../goUpByTheTree";
import { HtmlElementTreeNode } from "../HtmlElementTreeNode";

export function getElementInfo(found: HTMLElement): FullElementInfo | null {
  // Instead of labels, return this element, parent elements leading to closest component, its component labels, all wrapping components labels.
  const labels: LabelData[] = [];

  const fiber = findFiberByHtmlElement(found, false);
  if (fiber) {
    const { component, componentBox, parentElements } =
      getAllParentsElementsAndRootComponent(fiber);

    const allPotentialComponentFibers = getAllWrappingParents(component);

    // This handles a common case when the component root is basically the comopnent itself, so I want to go to usage of the component
    // TODO: whaat? why? currently I see that it adds the original styled components which is not necessary.

    // if (fiber.return && fiber.return === fiber._debugOwner) {
    //   allPotentialComponentFibers.unshift(fiber.return);
    // }

    allPotentialComponentFibers.forEach((fiber) => {
      const fiberWithSource = findDebugSource(fiber);
      if (fiberWithSource) {
        const label = getFiberLabel(
          fiberWithSource.fiber,
          fiberWithSource.source
        );
        labels.push(label);
      }
    });

    const thisLabel = getFiberLabel(fiber, findDebugSource(fiber)?.source);

    if (isStyledElement(fiber)) {
      thisLabel.label = `${thisLabel.label} (styled)`;
    }

    return {
      thisElement: {
        box: getFiberOwnBoundingBox(fiber) || found.getBoundingClientRect(),
        ...thisLabel,
      },
      htmlElement: found,
      parentElements: parentElements,
      componentBox,
      componentsLabels: deduplicateLabels(labels),
    };
  }

  return null;
}

export class ReactTreeNodeElement extends HtmlElementTreeNode {
  getSource(): Source | null {
    const fiber = findFiberByHtmlElement(this.element, false);

    if (fiber && fiber._debugSource) {
      return {
        fileName: fiber._debugSource.fileName,
        lineNumber: fiber._debugSource.lineNumber,
        columnNumber: fiber._debugSource.columnNumber,
      };
    }
    return null;
  }

  private fiberToTreeNodeComponent(fiber: Fiber): TreeNodeComponent {
    const fiberLabel = getFiberLabel(fiber, findDebugSource(fiber)?.source);
    return {
      label: fiberLabel.label,
      callLink:
        (fiberLabel.link && {
          fileName: fiberLabel.link.filePath,
          lineNumber: fiberLabel.link.line,
          columnNumber: fiberLabel.link.column,
          projectPath: fiberLabel.link.projectPath,
        }) ||
        undefined,
    };
  }

  getComponent(): TreeNodeComponent | null {
    const fiber = findFiberByHtmlElement(this.element, false);
    const componentFiber = fiber?._debugOwner;

    if (componentFiber) {
      return this.fiberToTreeNodeComponent(componentFiber);
    }
    return null;
  }

  /**
   * Traverse the _debugOwner chain to collect all owner components.
   * This finds wrapper components (like Sidebar) that don't render their own DOM elements
   * but wrap other components (like GlassPanel) that do.
   *
   * Returns array from outermost owner (Sidebar) to innermost (GlassPanel).
   */
  getOwnerComponents(): TreeNodeComponent[] {
    const fiber = findFiberByHtmlElement(this.element, false);
    if (!fiber) return [];

    // Get the parent DOM element's owner to know when to stop
    const parentElement = this.element.parentElement;
    let parentOwnerFiber: Fiber | null = null;
    if (parentElement) {
      const parentFiber = findFiberByHtmlElement(parentElement, false);
      parentOwnerFiber = parentFiber?._debugOwner || null;
    }

    const components: TreeNodeComponent[] = [];
    let currentFiber = fiber._debugOwner;

    // Traverse up the _debugOwner chain until we hit the parent's owner or run out
    while (currentFiber) {
      // Stop if we've reached the parent DOM element's owner component
      if (parentOwnerFiber && currentFiber === parentOwnerFiber) {
        break;
      }

      components.push(this.fiberToTreeNodeComponent(currentFiber));
      currentFiber = currentFiber._debugOwner || null;
    }

    // Reverse so outermost (Sidebar) comes first, innermost (GlassPanel) last
    return components.reverse();
  }
}

function getTree(element: HTMLElement): TreeState | null {
  const originalRoot: TreeNode = new ReactTreeNodeElement(element);

  return goUpByTheTree(originalRoot);
}

function fiberToPathItem(fiber: Fiber): ParentPathItem {
  const label = getFiberLabel(fiber, findDebugSource(fiber)?.source);

  return {
    title: label.label,
    link: label.link,
  };
}

function getParentsPaths(element: HTMLElement) {
  const fiber = findFiberByHtmlElement(element, false);
  if (fiber) {
    const pathItems: ParentPathItem[] = [];
    let currentFiber = fiber;
    pathItems.push(fiberToPathItem(currentFiber));

    while (currentFiber._debugOwner) {
      currentFiber = currentFiber._debugOwner;
      pathItems.push(fiberToPathItem(currentFiber));
    }

    return pathItems;
  }
  return [];
}

const reactAdapter: AdapterObject = {
  getElementInfo,
  getTree,
  getParentsPaths,
};

export default reactAdapter;
