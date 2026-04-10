/* eslint-disable no-console */
import { Fiber } from "@locator/shared";
import { getUsableName } from "../../functions/getUsableName";
import { mergeRects } from "../../functions/mergeRects";
import { SimpleDOMRect } from "../../types/types";
import { ElementInfo } from "../adapterApi";
import { getFiberComponentBoundingBox } from "./getFiberComponentBoundingBox";
import { isStyledElement } from "./isStyled";

export function getAllParentsElementsAndRootComponent(fiber: Fiber): {
  component: Fiber;
  componentBox: SimpleDOMRect;
  parentElements: ElementInfo[];
} | null {
  const parentElements: ElementInfo[] = [];
  const deepestElement = fiber.stateNode;
  if (!deepestElement || !(deepestElement instanceof Element)) {
    console.warn("[TreeLocator] Skipping fiber with non-Element stateNode:", fiber.type, fiber.stateNode);
    return null;
  }
  let componentBox: SimpleDOMRect = deepestElement.getBoundingClientRect();

  // For styled-components we rather use parent element
  let currentFiber =
    isStyledElement(fiber) && fiber._debugOwner ? fiber._debugOwner : fiber;
  while (currentFiber._debugOwner || currentFiber.return) {
    currentFiber = currentFiber._debugOwner || currentFiber.return!;
    const currentElement = currentFiber.stateNode;
    if (!currentElement || !(currentElement instanceof Element)) {
      return {
        component: currentFiber,
        parentElements,
        componentBox:
          getFiberComponentBoundingBox(currentFiber) || componentBox,
      };
    }

    const usableName = getUsableName(currentFiber);

    componentBox = mergeRects(
      componentBox,
      currentElement.getBoundingClientRect()
    );

    parentElements.push({
      box: currentElement.getBoundingClientRect(),
      label: usableName,
      link: null,
    });
  }
  console.warn("[TreeLocator] Could not find root component for fiber:", fiber.type);
  return null;
}
