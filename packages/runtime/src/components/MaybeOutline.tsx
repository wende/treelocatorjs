import { Targets } from "@locator/shared";
import { createMemo } from "solid-js";
import { AdapterId } from "../consts";
import { getElementInfo } from "../adapters/getElementInfo";
import { Outline } from "./Outline";
import { parsePhoenixServerComponents } from "../adapters/phoenix/parsePhoenixComments";

export function MaybeOutline(props: {
  currentElement: HTMLElement;
  adapterId?: AdapterId;
  targets: Targets;
}) {
  const elInfo = createMemo(() =>
    getElementInfo(props.currentElement, props.adapterId)
  );

  // Check for Phoenix server components when client framework data is not available
  const phoenixInfo = createMemo(() => {
    if (elInfo()) return null; // Client framework takes precedence

    // Try current element first
    let serverComponents = parsePhoenixServerComponents(props.currentElement);
    if (serverComponents) return serverComponents;

    // Walk up the tree to find the nearest parent with Phoenix components
    let parent = props.currentElement.parentElement;
    while (parent && parent !== document.body) {
      serverComponents = parsePhoenixServerComponents(parent);
      if (serverComponents) return serverComponents;
      parent = parent.parentElement;
    }

    return null;
  });

  const box = () => props.currentElement.getBoundingClientRect();

  return (
    <>
      {elInfo() ? (
        <Outline
          element={elInfo()!}
          targets={props.targets}
        />
      ) : phoenixInfo() ? (
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
          {/* Phoenix component label */}
          <div
            class="fixed text-xs font-medium rounded-md"
            style={{
              "z-index": 3,
              left: box().x + 4 + "px",
              top: box().y + 4 + "px",
              padding: "4px 10px",
              background: "rgba(79, 70, 229, 0.85)",
              color: "#fff",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              "box-shadow": "0 4px 16px rgba(0, 0, 0, 0.2)",
              "font-family": "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Monaco, Consolas, monospace",
              "letter-spacing": "0.01em",
            }}
          >
            {phoenixInfo()!
              .filter((sc) => sc.type === "component")
              .map((sc) => sc.name.split(".").pop())
              .join(" > ")}
          </div>
        </div>
      ) : (
        <div>
          {/* Element outline box */}
          <div
            class="fixed rounded border border-solid border-gray-500"
            style={{
              "z-index": 2,
              left: box().x + "px",
              top: box().y + "px",
              width: box().width + "px",
              height: box().height + "px",
            }}
          />
          {/* DOM element label */}
          <div
            class="fixed text-xs font-medium rounded-md"
            style={{
              "z-index": 3,
              left: box().x + 4 + "px",
              top: box().y + 4 + "px",
              padding: "4px 10px",
              background: "rgba(75, 85, 99, 0.85)",
              color: "#fff",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              "box-shadow": "0 4px 16px rgba(0, 0, 0, 0.2)",
              "font-family": "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Monaco, Consolas, monospace",
              "letter-spacing": "0.01em",
            }}
          >
            {props.currentElement.tagName.toLowerCase()}
            {props.currentElement.id ? `#${props.currentElement.id}` : ""}
            {props.currentElement.className ? `.${props.currentElement.className.split(" ")[0]}` : ""}
          </div>
        </div>
      )}
    </>
  );
}
