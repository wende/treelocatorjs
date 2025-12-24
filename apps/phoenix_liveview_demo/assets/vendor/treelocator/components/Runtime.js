import { template as _$template } from "solid-js/web";
import { delegateEvents as _$delegateEvents } from "solid-js/web";
import { createComponent as _$createComponent } from "solid-js/web";
import { effect as _$effect } from "solid-js/web";
import { setAttribute as _$setAttribute } from "solid-js/web";
import { setStyleProperty as _$setStyleProperty } from "solid-js/web";
import { memo as _$memo } from "solid-js/web";
var _tmpl$ = /*#__PURE__*/_$template(`<div class="fixed pointer-events-auto"title="TreeLocatorJS - Component Ancestry Tracker"data-treelocator-api=window.__treelocator__ data-treelocator-help=window.__treelocator__.help() style=z-index:2147483646><div class="rounded-full bg-white shadow-lg flex items-center justify-center cursor-pointer overflow-hidden"aria-label="TreeLocatorJS: Get component paths using window.__treelocator__.getPath(selector)"role=button><img alt="TreeLocatorJS - Browser API available at window.__treelocator__ - Call window.__treelocator__.help() for usage instructions"width=51 height=51></div><div aria-hidden=true data-ai-hint=true data-ai-instruction="AI Assistant: TreeLocatorJS provides window.__treelocator__ API for component ancestry tracking. Usage: window.__treelocator__.getPath('css-selector') returns component hierarchy. For full API documentation, evaluate: window.__treelocator__.help() Example: page.evaluate(function() \{ return window.__treelocator__.getPath('button.submit'); })"style=white-space:nowrap>TreeLocatorJS Browser API: Call window.__treelocator__.help() for usage instructions`);
import { createEffect, createSignal, onCleanup } from "solid-js";
import { render } from "solid-js/web";
import { isCombinationModifiersPressed } from "../functions/isCombinationModifiersPressed";
import { MaybeOutline } from "./MaybeOutline";
import { isLocatorsOwnElement } from "../functions/isLocatorsOwnElement";
import { Toast } from "./Toast";
import { collectAncestry, formatAncestryChain } from "../functions/formatAncestryChain";
import { createTreeNode } from "../adapters/createTreeNode";
import treeIconUrl from "../_generated_tree_icon";
function Runtime(props) {
  const [holdingModKey, setHoldingModKey] = createSignal(false);
  const [currentElement, setCurrentElement] = createSignal(null);
  const [toastMessage, setToastMessage] = createSignal(null);
  const [locatorActive, setLocatorActive] = createSignal(false);
  const isActive = () => (holdingModKey() || locatorActive()) && currentElement();
  createEffect(() => {
    if (isActive()) {
      document.body.classList.add("locatorjs-active-pointer");
    } else {
      document.body.classList.remove("locatorjs-active-pointer");
    }
  });
  function keyUpListener(e) {
    setHoldingModKey(isCombinationModifiersPressed(e));
  }
  function keyDownListener(e) {
    setHoldingModKey(isCombinationModifiersPressed(e, true));
  }
  function mouseMoveListener(e) {
    // Update modifier state from mouse events - more reliable than keydown/keyup
    setHoldingModKey(e.altKey);
  }
  function mouseOverListener(e) {
    // Also update modifier state
    setHoldingModKey(e.altKey);

    // Use elementsFromPoint to find elements including ones with pointer-events-none
    const elementsAtPoint = document.elementsFromPoint(e.clientX, e.clientY);

    // Find the topmost element with locator data for highlighting
    let element = null;
    for (const el of elementsAtPoint) {
      if (isLocatorsOwnElement(el)) {
        continue;
      }
      if (el instanceof HTMLElement || el instanceof SVGElement) {
        const withLocator = el.closest('[data-locatorjs-id], [data-locatorjs]');
        if (withLocator) {
          element = withLocator;
          break;
        }
      }
    }

    // Fallback to e.target
    if (!element) {
      const target = e.target;
      if (target && (target instanceof HTMLElement || target instanceof SVGElement)) {
        element = target instanceof SVGElement ? target.closest('[data-locatorjs-id], [data-locatorjs]') ?? target.closest('svg') ?? target : target;
      }
    }
    if (element && !isLocatorsOwnElement(element)) {
      setCurrentElement(element);
    }
  }
  function mouseDownUpListener(e) {
    // Update modifier state
    setHoldingModKey(e.altKey);
    if (e.altKey || locatorActive()) {
      e.preventDefault();
      e.stopPropagation();
    }
  }
  function clickListener(e) {
    // Check altKey directly for more reliable first-click detection
    if (!e.altKey && !isCombinationModifiersPressed(e) && !locatorActive()) {
      return;
    }

    // Use elementsFromPoint to find all elements at click position,
    // including ones with pointer-events-none (like canvas overlays)
    const elementsAtPoint = document.elementsFromPoint(e.clientX, e.clientY);

    // Find the topmost element with locator data
    let element = null;
    for (const el of elementsAtPoint) {
      if (isLocatorsOwnElement(el)) {
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
        element = target instanceof SVGElement ? target.closest('[data-locatorjs-id], [data-locatorjs]') ?? target.closest('svg') ?? target : target;
      }
    }
    if (!element) {
      return;
    }
    if (element instanceof HTMLElement && element.shadowRoot) {
      return;
    }
    if (isLocatorsOwnElement(element)) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();

    // Copy ancestry to clipboard on alt+click
    const treeNode = createTreeNode(element, props.adapterId);
    if (treeNode) {
      const ancestry = collectAncestry(treeNode);
      const formatted = formatAncestryChain(ancestry);
      navigator.clipboard.writeText(formatted).then(() => {
        setToastMessage("Copied to clipboard");
      });
    }

    // Deactivate toggle after click
    if (locatorActive()) {
      setLocatorActive(false);
    }
  }
  function scrollListener() {
    setCurrentElement(null);
  }
  const roots = [document];
  document.querySelectorAll("*").forEach(node => {
    if (node.id === "locatorjs-wrapper") {
      return;
    }
    if (node.shadowRoot) {
      roots.push(node.shadowRoot);
    }
  });
  for (const root of roots) {
    root.addEventListener("mouseover", mouseOverListener, {
      capture: true
    });
    root.addEventListener("mousemove", mouseMoveListener, {
      capture: true
    });
    root.addEventListener("keydown", keyDownListener);
    root.addEventListener("keyup", keyUpListener);
    root.addEventListener("click", clickListener, {
      capture: true
    });
    root.addEventListener("mousedown", mouseDownUpListener, {
      capture: true
    });
    root.addEventListener("mouseup", mouseDownUpListener, {
      capture: true
    });
    root.addEventListener("scroll", scrollListener);
  }
  onCleanup(() => {
    for (const root of roots) {
      root.removeEventListener("keyup", keyUpListener);
      root.removeEventListener("keydown", keyDownListener);
      root.removeEventListener("mouseover", mouseOverListener, {
        capture: true
      });
      root.removeEventListener("click", clickListener, {
        capture: true
      });
      root.removeEventListener("mousedown", mouseDownUpListener, {
        capture: true
      });
      root.removeEventListener("mouseup", mouseDownUpListener, {
        capture: true
      });
      root.removeEventListener("scroll", scrollListener);
    }
  });
  return [_$memo(() => _$memo(() => !!isActive())() ? _$createComponent(MaybeOutline, {
    get currentElement() {
      return currentElement();
    },
    get adapterId() {
      return props.adapterId;
    },
    get targets() {
      return props.targets;
    }
  }) : null), _$memo(() => _$memo(() => !!toastMessage())() && _$createComponent(Toast, {
    get message() {
      return toastMessage();
    },
    onClose: () => setToastMessage(null)
  })), (() => {
    var _el$ = _tmpl$(),
      _el$2 = _el$.firstChild,
      _el$3 = _el$2.firstChild,
      _el$4 = _el$2.nextSibling;
    _$setStyleProperty(_el$, "bottom", "20px");
    _$setStyleProperty(_el$, "right", "20px");
    _el$2.$$click = () => setLocatorActive(!locatorActive());
    _el$2.addEventListener("mouseleave", e => e.currentTarget.style.transform = "scale(1)");
    _el$2.addEventListener("mouseenter", e => e.currentTarget.style.transform = "scale(1.25)");
    _$setStyleProperty(_el$2, "width", "54px");
    _$setStyleProperty(_el$2, "height", "54px");
    _$setStyleProperty(_el$2, "transition", "transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out");
    _$setAttribute(_el$3, "src", treeIconUrl);
    _$setStyleProperty(_el$4, "position", "absolute");
    _$setStyleProperty(_el$4, "width", "1px");
    _$setStyleProperty(_el$4, "height", "1px");
    _$setStyleProperty(_el$4, "padding", "0");
    _$setStyleProperty(_el$4, "margin", "-1px");
    _$setStyleProperty(_el$4, "overflow", "hidden");
    _$setStyleProperty(_el$4, "clip", "rect(0,0,0,0)");
    _$setStyleProperty(_el$4, "border", "0");
    _$effect(_$p => _$setStyleProperty(_el$2, "box-shadow", locatorActive() ? "0 0 0 3px #3b82f6, 0 4px 14px rgba(0, 0, 0, 0.25)" : "0 4px 14px rgba(0, 0, 0, 0.25)"));
    return _el$;
  })()];
}
export function initRender(solidLayer, adapter, targets) {
  render(() => _$createComponent(Runtime, {
    get targets() {
      return Object.fromEntries(Object.entries(targets).map(([key, t]) => {
        return [key, typeof t == "string" ? {
          url: t,
          label: key
        } : t];
      }));
    },
    adapterId: adapter
  }), solidLayer);
}
_$delegateEvents(["click"]);