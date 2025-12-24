import type { Targets } from "@locator/shared";
import type { FullElementInfo } from "../adapters/adapterApi";
type Box = {
    top: number;
    left: number;
    width: number;
    height: number;
    label: string;
};
type IndividualBoxes = {
    top: Box;
    left: Box;
    right: Box;
    bottom: Box;
};
export type AllBoxes = {
    margin: IndividualBoxes;
    padding: IndividualBoxes;
    innerBox: Box;
};
export declare function Outline(props: {
    element: FullElementInfo;
    targets: Targets;
}): import("solid-js").JSX.Element;
export {};
