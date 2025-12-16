import { For } from "solid-js";
import { PADDING } from "../consts";
import { LabelData } from "../types/LabelData";
import { SimpleDOMRect } from "../types/types";

export function ComponentOutline(props: {
  bbox: SimpleDOMRect;
  labels: LabelData[];
  element: HTMLElement;
}) {
  const isInside = () => props.bbox.height >= window.innerHeight - 40;
  const isBelow = () => props.bbox.y < 30 && !isInside();

  const left = () => Math.max(props.bbox.x - PADDING, 0);
  const top = () => Math.max(props.bbox.y - PADDING, 0);

  const cutFromTop = () => (props.bbox.y < 0 ? -(props.bbox.y - PADDING) : 0);
  const cutFromLeft = () => (props.bbox.x < 0 ? -(props.bbox.x - PADDING) : 0);

  const width = () =>
    Math.min(props.bbox.width - cutFromLeft() + PADDING * 2, window.innerWidth);
  const height = () =>
    Math.min(
      props.bbox.height - cutFromTop() + PADDING * 2,
      window.innerHeight
    );

  return (
    <div
      class="border border-purple-500"
      style={{
        "z-index": 1,
        position: "fixed",
        left: left() + "px",
        top: top() + "px",
        width: width() + "px",
        height: height() + "px",
        "border-top-left-radius": left() === 0 || top() === 0 ? "0" : "8px",
        "border-top-right-radius":
          left() + width() === window.innerWidth || top() === 0 ? "0" : "8px",
        "border-bottom-left-radius":
          left() === 0 || top() + height() === window.innerHeight ? "0" : "8px",
        "border-bottom-right-radius":
          left() + width() === window.innerWidth ||
          top() + height() === window.innerHeight
            ? "0"
            : "8px",
      }}
    >
      <div
        id="locatorjs-labels-section"
        style={{
          position: "absolute",
          display: "flex",
          "justify-content": "center",
          bottom: isBelow() ? (isInside() ? "2px" : "-28px") : undefined,
          top: isBelow() ? undefined : isInside() ? "2px" : "-28px",
          left: "0px",
          width: "100%",
          "pointer-events": "auto",
          cursor: "pointer",
          ...(isBelow()
            ? {
                "border-bottom-left-radius": "100%",
                "border-bottom-right-radius": "100%",
              }
            : {
                "border-top-left-radius": "100%",
                "border-top-right-radius": "100%",
              }),
        }}
      >
        <div
          id="locatorjs-labels-wrapper"
          style={{
            padding: isBelow() ? "10px 10px 2px 10px" : "2px 10px 10px 10px",
          }}
        >
          <For each={props.labels}>
            {(label) => {
              const labelClass =
                "bg-purple-500 block text-white text-xs font-bold text-center px-1 py-0.5 rounded whitespace-nowrap pointer-events-auto";
              const labelStyles = {
                "line-height": "18px",
              };

              return (
                <div class={labelClass} style={labelStyles}>
                  {label.label}
                </div>
              );
            }}
          </For>
        </div>
      </div>
    </div>
  );
}
