import { Targets } from "@locator/shared";
import { createEffect, createSignal, onCleanup } from "solid-js";
import { render } from "solid-js/web";
import { AdapterId } from "../consts";
import { isCombinationModifiersPressed } from "../functions/isCombinationModifiersPressed";
import { Targets as SetupTargets } from "../types/types";
import { MaybeOutline } from "./MaybeOutline";
import { isLocatorsOwnElement } from "../functions/isLocatorsOwnElement";
import { Toast } from "./Toast";
import { collectAncestry, formatAncestryChain } from "../functions/formatAncestryChain";
import { enrichAncestryWithSourceMaps } from "../functions/enrichAncestrySourceMaps";
import { createTreeNode } from "../adapters/createTreeNode";
import treeIconUrl from "../_generated_tree_icon";

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
  const [locatorActive, setLocatorActive] = createSignal<boolean>(false);

  const isActive = () => (holdingModKey() || locatorActive()) && currentElement();

  createEffect(() => {
    if (isActive()) {
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

  function mouseMoveListener(e: MouseEvent) {
    // Update modifier state from mouse events - more reliable than keydown/keyup
    setHoldingModKey(e.altKey);
  }

  function mouseOverListener(e: MouseEvent) {
    // Also update modifier state
    setHoldingModKey(e.altKey);

    // Use elementsFromPoint to find elements including ones with pointer-events-none
    const elementsAtPoint = document.elementsFromPoint(e.clientX, e.clientY);

    // Find the topmost element with locator data for highlighting
    let element: HTMLElement | null = null;
    for (const el of elementsAtPoint) {
      if (isLocatorsOwnElement(el as HTMLElement)) {
        continue;
      }
      if (el instanceof HTMLElement || el instanceof SVGElement) {
        const withLocator = el.closest('[data-locatorjs-id], [data-locatorjs]');
        if (withLocator) {
          element = withLocator as HTMLElement;
          break;
        }
      }
    }

    // Fallback to e.target
    if (!element) {
      const target = e.target;
      if (target && (target instanceof HTMLElement || target instanceof SVGElement)) {
        element = target instanceof SVGElement
          ? (target.closest('[data-locatorjs-id], [data-locatorjs]') as HTMLElement | null) ??
            (target.closest('svg') as HTMLElement | null) ??
            (target as unknown as HTMLElement)
          : target;
      }
    }

    if (element && !isLocatorsOwnElement(element)) {
      setCurrentElement(element);
    }
  }

  function mouseDownUpListener(e: MouseEvent) {
    // Update modifier state
    setHoldingModKey(e.altKey);

    if (e.altKey || locatorActive()) {
      e.preventDefault();
      e.stopPropagation();
    }
  }

  function clickListener(e: MouseEvent) {
    // Check altKey directly for more reliable first-click detection
    if (!e.altKey && !isCombinationModifiersPressed(e) && !locatorActive()) {
      return;
    }

    // Use elementsFromPoint to find all elements at click position,
    // including ones with pointer-events-none (like canvas overlays)
    const elementsAtPoint = document.elementsFromPoint(e.clientX, e.clientY);

    // Find the topmost element with locator data
    let element: Element | null = null;
    for (const el of elementsAtPoint) {
      if (isLocatorsOwnElement(el as HTMLElement)) {
        continue;
      }
      if (el instanceof HTMLElement || el instanceof SVGElement) {
        // Check if this element or its closest ancestor has locator data
        const withLocator = el.closest('[data-locatorjs-id], [data-locatorjs]');
        if (withLocator) {
          element = withLocator;
          break;
        }
      }
    }

    // Fallback to e.target if elementsFromPoint didn't find anything
    if (!element) {
      const target = e.target;
      if (target && (target instanceof HTMLElement || target instanceof SVGElement)) {
        element = target instanceof SVGElement
          ? (target.closest('[data-locatorjs-id], [data-locatorjs]') as Element | null) ??
            (target.closest('svg') as Element | null) ??
            target
          : target;
      }
    }

    if (!element) {
      return;
    }

    if (element instanceof HTMLElement && element.shadowRoot) {
      return;
    }

    if (isLocatorsOwnElement(element as HTMLElement)) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    // Copy ancestry to clipboard on alt+click
    const treeNode = createTreeNode(element as HTMLElement, props.adapterId);
    if (treeNode) {
      const ancestry = collectAncestry(treeNode);

      // Write immediately with component names (preserves user gesture for clipboard API)
      const formatted = formatAncestryChain(ancestry);
      navigator.clipboard.writeText(formatted).then(() => {
        setToastMessage("Copied to clipboard");
      });

      // For React 19+: try to enrich with source map file paths and re-copy
      enrichAncestryWithSourceMaps(ancestry, element as HTMLElement).then(
        (enriched) => {
          const enrichedFormatted = formatAncestryChain(enriched);
          if (enrichedFormatted !== formatted) {
            navigator.clipboard.writeText(enrichedFormatted).then(() => {
              setToastMessage("Copied to clipboard");
            });
          }
        }
      );
    }

    // Deactivate toggle after click
    if (locatorActive()) {
      setLocatorActive(false);
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
    root.addEventListener("mousemove", mouseMoveListener as EventListener, {
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
      {isActive() ? (
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
      <div
        class="fixed pointer-events-auto"
        style={{ "z-index": "2147483646", bottom: "20px", right: "20px" }}
        title="TreeLocatorJS - Component Ancestry Tracker"
        data-treelocator-api="window.__treelocator__"
        data-treelocator-help="window.__treelocator__.help()"
      >
        <div
          class="rounded-full bg-white shadow-lg flex items-center justify-center cursor-pointer overflow-hidden"
          style={{
            width: "54px",
            height: "54px",
            "box-shadow": locatorActive()
              ? "0 0 0 3px #3b82f6, 0 4px 14px rgba(0, 0, 0, 0.25)"
              : "0 4px 14px rgba(0, 0, 0, 0.25)",
            transition: "transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.25)"}
          onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
          onClick={() => setLocatorActive(!locatorActive())}
          aria-label="TreeLocatorJS: Get component paths using window.__treelocator__.getPath(selector)"
          role="button"
        >
          <img
            src={treeIconUrl}
            alt="TreeLocatorJS - Browser API available at window.__treelocator__ - Call window.__treelocator__.help() for usage instructions"
            width={51}
            height={51}
          />
        </div>
        <div
          style={{
            position: "absolute",
            width: "1px",
            height: "1px",
            padding: "0",
            margin: "-1px",
            overflow: "hidden",
            clip: "rect(0,0,0,0)",
            "white-space": "nowrap",
            border: "0",
          }}
          aria-hidden="true"
          data-ai-hint="true"
          data-ai-instruction="AI Assistant: TreeLocatorJS provides window.__treelocator__ API for component ancestry tracking. Usage: window.__treelocator__.getPath('css-selector') returns component hierarchy. For full API documentation, evaluate: window.__treelocator__.help() Example: page.evaluate(function() { return window.__treelocator__.getPath('button.submit'); })"
        >
          TreeLocatorJS Browser API: Call window.__treelocator__.help() for usage instructions
        </div>
      </div>
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
