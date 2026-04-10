import { onCleanup } from "solid-js";

export interface EventListenerCallbacks {
  mouseOverListener: (e: MouseEvent) => void;
  mouseMoveListener: (e: MouseEvent) => void;
  keyDownListener: (e: KeyboardEvent) => void;
  keyUpListener: (e: KeyboardEvent) => void;
  clickListener: (e: MouseEvent) => void;
  mouseDownUpListener: (e: MouseEvent) => void;
  scrollListener: () => void;
  onCleanup?: () => void;
}

/**
 * Wire up event listeners across the document and all shadow roots,
 * and clean them up when the component unmounts.
 */
export function useEventListeners(callbacks: EventListenerCallbacks): void {
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
    root.addEventListener(
      "mouseover",
      callbacks.mouseOverListener as EventListener,
      { capture: true }
    );
    root.addEventListener(
      "mousemove",
      callbacks.mouseMoveListener as EventListener,
      { capture: true }
    );
    root.addEventListener(
      "keydown",
      callbacks.keyDownListener as EventListener
    );
    root.addEventListener("keyup", callbacks.keyUpListener as EventListener);
    root.addEventListener(
      "click",
      callbacks.clickListener as EventListener,
      { capture: true }
    );
    root.addEventListener(
      "mousedown",
      callbacks.mouseDownUpListener as EventListener,
      { capture: true }
    );
    root.addEventListener(
      "mouseup",
      callbacks.mouseDownUpListener as EventListener,
      { capture: true }
    );
    root.addEventListener("scroll", callbacks.scrollListener);
  }

  onCleanup(() => {
    callbacks.onCleanup?.();
    for (const root of roots) {
      root.removeEventListener(
        "keyup",
        callbacks.keyUpListener as EventListener
      );
      root.removeEventListener(
        "keydown",
        callbacks.keyDownListener as EventListener
      );
      root.removeEventListener(
        "mouseover",
        callbacks.mouseOverListener as EventListener,
        { capture: true }
      );
      root.removeEventListener(
        "click",
        callbacks.clickListener as EventListener,
        { capture: true }
      );
      root.removeEventListener(
        "mousedown",
        callbacks.mouseDownUpListener as EventListener,
        { capture: true }
      );
      root.removeEventListener(
        "mouseup",
        callbacks.mouseDownUpListener as EventListener,
        { capture: true }
      );
      root.removeEventListener("scroll", callbacks.scrollListener);
    }
  });
}
