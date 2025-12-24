import { Target } from "@locator/shared";
import { AdapterId } from "./consts";
export declare function initRuntime({ adapter, targets, }?: {
    adapter?: AdapterId;
    targets?: {
        [k: string]: Target | string;
    };
}): void;
