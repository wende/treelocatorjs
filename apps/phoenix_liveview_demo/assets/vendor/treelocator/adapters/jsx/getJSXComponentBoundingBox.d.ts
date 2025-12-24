import type { FileStorage } from "@locator/shared";
import type { SimpleDOMRect } from "../../types/types";
export declare function getJSXComponentBoundingBox(found: Element, locatorData: {
    [filename: string]: FileStorage;
}, componentFolder: string, componentId: number): SimpleDOMRect;
