import { Targets } from "@locator/shared";
import { createMemo } from "solid-js";
import { AdapterId } from "../consts";
import { getElementInfo } from "../adapters/getElementInfo";
import { Outline } from "./Outline";

export function MaybeOutline(props: {
  currentElement: HTMLElement;
  adapterId?: AdapterId;
  targets: Targets;
}) {
  const elInfo = createMemo(() =>
    getElementInfo(props.currentElement, props.adapterId)
  );
  const box = () => props.currentElement.getBoundingClientRect();
  return (
    <>
      {elInfo() ? (
        <Outline
          element={elInfo()!}
          targets={props.targets}
        />
      ) : (
        <div>
          {/* Element outline box */}
          <div
            class="fixed rounded border border-solid border-amber-500"
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
              background: "rgba(120, 53, 15, 0.85)",
              color: "#fff",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              "box-shadow": "0 4px 16px rgba(0, 0, 0, 0.2)",
              "font-family": "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Monaco, Consolas, monospace",
              "letter-spacing": "0.01em",
            }}
          >
            No source found
          </div>
        </div>
      )}
    </>
  );
}
