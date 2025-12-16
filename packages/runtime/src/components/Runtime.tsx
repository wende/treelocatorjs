import { Targets } from "@locator/shared";
import { batch, createEffect, createSignal, onCleanup } from "solid-js";
import { render } from "solid-js/web";
import { AdapterId } from "../consts";
import { isCombinationModifiersPressed } from "../functions/isCombinationModifiersPressed";
import { Targets as SetupTargets } from "../types/types";
import { MaybeOutline } from "./MaybeOutline";
import { isLocatorsOwnElement } from "../functions/isLocatorsOwnElement";
import { getElementInfo } from "../adapters/getElementInfo";
import { Toast } from "./Toast";
import { collectAncestry, formatAncestryChain } from "../functions/formatAncestryChain";
import { createTreeNode } from "../adapters/createTreeNode";

type RuntimeProps = {
  adapterId?: AdapterId;
  targets: Targets;
};

function Runtime(props: RuntimeProps) {
  const [holdingModKey, setHoldingModKey] = createSignal<boolean>(false);
  const [currentElement, setCurrentElement] = createSignal<HTMLElement | null>(
    null
  );
  const [toastMessage, setToastMessage] = createSignal<string | null>(null);

  createEffect(() => {
    if (holdingModKey() && currentElement()) {
      document.body.classList.add("locatorjs-active-pointer");
    } else {
      document.body.classList.remove("locatorjs-active-pointer");
    }
  });

  function keyUpListener(e: KeyboardEvent) {
    setHoldingModKey(isCombinationModifiersPressed(e));
  }

  function keyDownListener(e: KeyboardEvent) {
    setHoldingModKey(isCombinationModifiersPressed(e, true));
  }

  function mouseOverListener(e: MouseEvent) {
    const target = e.target;
    if (target && target instanceof HTMLElement) {
      if (isLocatorsOwnElement(target)) {
        return;
      }

      setHoldingModKey(isCombinationModifiersPressed(e, true));

      batch(() => {
        setCurrentElement(target);
      });
    }
  }

  function mouseDownUpListener(e: MouseEvent) {
    if (isCombinationModifiersPressed(e)) {
      e.preventDefault();
      e.stopPropagation();
    }
  }

  function clickListener(e: MouseEvent) {
    if (!isCombinationModifiersPressed(e)) {
      return;
    }

    const target = e.target;
    if (target && target instanceof HTMLElement) {
      if (target.shadowRoot) {
        return;
      }

      if (isLocatorsOwnElement(target)) {
        return;
      }

      const elInfo = getElementInfo(target, props.adapterId);

      if (elInfo) {
        const linkProps = elInfo.thisElement.link;
        if (linkProps) {
          e.preventDefault();
          e.stopPropagation();

          // Copy ancestry to clipboard on click
          const treeNode = createTreeNode(target, props.adapterId);
          if (treeNode) {
            const ancestry = collectAncestry(treeNode);
            const formatted = formatAncestryChain(ancestry);
            navigator.clipboard.writeText(formatted).then(() => {
              setToastMessage("Copied to clipboard");
            });
          }
        }
      }
    }
  }

  function scrollListener() {
    setCurrentElement(null);
  }

  const roots: (Document | ShadowRoot)[] = [document];
  document.querySelectorAll("*").forEach((node) => {
    if (node.id === "locatorjs-wrapper") {
      return;
    }
    if (node.shadowRoot) {
      roots.push(node.shadowRoot);
    }
  });

  for (const root of roots) {
    root.addEventListener("mouseover", mouseOverListener as EventListener, {
      capture: true,
    });
    root.addEventListener("keydown", keyDownListener as EventListener);
    root.addEventListener("keyup", keyUpListener as EventListener);
    root.addEventListener("click", clickListener as EventListener, {
      capture: true,
    });
    root.addEventListener("mousedown", mouseDownUpListener as EventListener, {
      capture: true,
    });
    root.addEventListener("mouseup", mouseDownUpListener as EventListener, {
      capture: true,
    });
    root.addEventListener("scroll", scrollListener);
  }

  onCleanup(() => {
    for (const root of roots) {
      root.removeEventListener("keyup", keyUpListener as EventListener);
      root.removeEventListener("keydown", keyDownListener as EventListener);
      root.removeEventListener(
        "mouseover",
        mouseOverListener as EventListener,
        { capture: true }
      );
      root.removeEventListener("click", clickListener as EventListener, {
        capture: true,
      });
      root.removeEventListener(
        "mousedown",
        mouseDownUpListener as EventListener,
        { capture: true }
      );
      root.removeEventListener(
        "mouseup",
        mouseDownUpListener as EventListener,
        { capture: true }
      );
      root.removeEventListener("scroll", scrollListener);
    }
  });

  return (
    <>
      {holdingModKey() && currentElement() ? (
        <MaybeOutline
          currentElement={currentElement()!}
          adapterId={props.adapterId}
          targets={props.targets}
        />
      ) : null}
      {toastMessage() && (
        <Toast
          message={toastMessage()!}
          onClose={() => setToastMessage(null)}
        />
      )}
    </>
  );
}

export function initRender(
  solidLayer: HTMLDivElement,
  adapter: AdapterId | undefined,
  targets: SetupTargets
) {
  render(
    () => (
      <Runtime
        targets={Object.fromEntries(
          Object.entries(targets).map(([key, t]) => {
            return [key, typeof t == "string" ? { url: t, label: key } : t];
          })
        )}
        adapterId={adapter}
      />
    ),
    solidLayer
  );
}
