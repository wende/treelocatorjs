import type { Targets } from "@locator/shared";
import type { FullElementInfo } from "../adapters/adapterApi";
import { RenderBoxes } from "./RenderBoxes";

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

export function Outline(props: {
  element: FullElementInfo;
  targets: Targets;
}) {
  const box = () => props.element.thisElement.box;

  const domElementInfo = () => {
    const htmlElement = props.element.htmlElement;
    const box = props.element.thisElement.box;
    if (htmlElement && box) {
      const style = window.getComputedStyle(htmlElement);

      const margin = {
        top: parseFloat(style.marginTop),
        left: parseFloat(style.marginLeft),
        right: parseFloat(style.marginRight),
        bottom: parseFloat(style.marginBottom),
      };
      const padding = {
        top: parseFloat(style.paddingTop),
        left: parseFloat(style.paddingLeft),
        right: parseFloat(style.paddingRight),
        bottom: parseFloat(style.paddingBottom),
      };
      const individualMarginBoxes: IndividualBoxes = {
        top: {
          top: box.y - margin.top,
          left: box.x,
          width: box.width,
          height: margin.top,
          label: label(margin.top),
        },
        left: {
          top: box.y - margin.top,
          left: box.x - margin.left,
          width: margin.left,
          height: box.height + margin.top + margin.bottom,
          label: label(margin.left),
        },
        right: {
          top: box.y - margin.top,
          left: box.x + box.width,
          width: margin.right,
          height: box.height + margin.top + margin.bottom,
          label: label(margin.right),
        },
        bottom: {
          top: box.y + box.height,
          left: box.x,
          width: box.width,
          height: margin.bottom,
          label: label(margin.bottom),
        },
      };

      const individualPaddingBoxes: IndividualBoxes = {
        top: {
          top: box.y,
          left: box.x,
          width: box.width,
          height: padding.top,
          label: label(padding.top),
        },
        left: {
          top: box.y + padding.top,
          left: box.x,
          width: padding.left,
          height: box.height - padding.top - padding.bottom,
          label: label(padding.left),
        },
        right: {
          top: box.y + padding.top,
          left: box.x + box.width - padding.right,
          width: padding.right,
          height: box.height - padding.top - padding.bottom,
          label: label(padding.right),
        },
        bottom: {
          top: box.y + box.height - padding.bottom,
          left: box.x,
          width: box.width,
          height: padding.bottom,
          label: label(padding.bottom),
        },
      };

      return {
        margin: individualMarginBoxes,
        padding: individualPaddingBoxes,
        innerBox: {
          top: box.y + padding.top,
          left: box.x + padding.left,
          width: box.width - padding.left - padding.right,
          height: box.height - padding.top - padding.bottom,
          label: "",
        },
      };
    }

    return null;
  };

  return (
    <>
      <div>
        {domElementInfo() && <RenderBoxes allBoxes={domElementInfo()!} />}
        {/* Element outline box */}
        <div
          class="fixed rounded border border-solid border-sky-500"
          style={{
            "z-index": 2,
            left: box().x + "px",
            top: box().y + "px",
            width: box().width + "px",
            height: box().height + "px",
          }}
        />
        {/* Glass morphism label */}
        <div
          class="fixed text-xs font-medium rounded-md"
          style={{
            "z-index": 3,
            left: box().x + 4 + "px",
            top: box().y + 4 + "px",
            padding: "4px 10px",
            background: "rgba(15, 23, 42, 0.85)",
            color: "#fff",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            "box-shadow": "0 4px 16px rgba(0, 0, 0, 0.2)",
            "font-family": "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Monaco, Consolas, monospace",
            "letter-spacing": "0.01em",
            "max-width": box().width - 8 + "px",
            overflow: "hidden",
            "text-overflow": "ellipsis",
            "white-space": "nowrap",
          }}
        >
          {props.element.thisElement.label}
        </div>
      </div>
    </>
  );
}

function label(value: number) {
  return value ? `${value}px` : "";
}
