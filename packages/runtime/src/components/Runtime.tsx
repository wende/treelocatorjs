import { Targets } from "@locator/shared";
import { createEffect, createSignal } from "solid-js";
import { render } from "solid-js/web";
import { AdapterId } from "../consts";
import { isCombinationModifiersPressed } from "../functions/isCombinationModifiersPressed";
import { Targets as SetupTargets } from "../types/types";
import { MaybeOutline } from "./MaybeOutline";
import { isLocatorsOwnElement } from "../functions/isLocatorsOwnElement";
import { Toast } from "./Toast";
import { collectAncestry, formatAncestryChain, truncateAtFirstFile, getElementLabel } from "../functions/formatAncestryChain";
import { enrichAncestryWithSourceMaps } from "../functions/enrichAncestrySourceMaps";
import { extractComputedStyles } from "../functions/extractComputedStyles";
import { createTreeNode } from "../adapters/createTreeNode";
import { RecordingOutline } from "./RecordingOutline";
import { RecordingResults } from "./RecordingResults";
import { RecordingPillButton } from "./RecordingPillButton";
import { SettingsPanel } from "./SettingsPanel";
import { useRecordingState } from "../hooks/useRecordingState";
import { useEventListeners } from "../hooks/useEventListeners";
import { settings } from "../hooks/useSettings";

type RuntimeProps = {
  adapterId?: AdapterId;
  targets: Targets;
};

function Runtime(props: RuntimeProps) {
  const [holdingModKey, setHoldingModKey] = createSignal<boolean>(false);
  const [holdingShift, setHoldingShift] = createSignal<boolean>(false);
  const [currentElement, setCurrentElement] = createSignal<HTMLElement | null>(
    null
  );
  const [toastMessage, setToastMessage] = createSignal<string | null>(null);
  const [locatorActive, setLocatorActive] = createSignal<boolean>(false);
  const [settingsOpen, setSettingsOpen] = createSignal<boolean>(false);

  const recording = useRecordingState(props.adapterId);

  const isActive = () =>
    (holdingModKey() ||
      locatorActive() ||
      recording.recordingState() === "selecting") &&
    currentElement();

  createEffect(() => {
    if (isActive()) {
      document.body.classList.add("locatorjs-active-pointer");
    } else {
      document.body.classList.remove("locatorjs-active-pointer");
    }
  });

  // Expose replay functions on the browser API
  if (typeof window !== "undefined" && (window as any).__treelocator__) {
    (window as any).__treelocator__.replay = () => recording.replayRecording();
    (window as any).__treelocator__.replayWithRecord = (
      elementOrSelector: HTMLElement | string
    ) => recording.replayWithRecord(elementOrSelector);
  }

  // --- Event handlers ---

  function eventPathHasAttribute(e: Event, attr: string): boolean {
    const path =
      typeof e.composedPath === "function"
        ? e.composedPath()
        : e.target
          ? [e.target]
          : [];
    return path.some(
      (node) => node instanceof Element && node.hasAttribute(attr)
    );
  }

  function findElementAtPoint(e: MouseEvent): HTMLElement | null {
    const elementsAtPoint = document.elementsFromPoint(e.clientX, e.clientY);
    for (const el of elementsAtPoint) {
      if (isLocatorsOwnElement(el as HTMLElement)) continue;
      if (el instanceof HTMLElement || el instanceof SVGElement) {
        const withLocator = el.closest(
          "[data-locatorjs-id], [data-locatorjs]"
        );
        if (withLocator) return withLocator as HTMLElement;
      }
    }
    const target = e.target;
    if (
      target &&
      (target instanceof HTMLElement || target instanceof SVGElement)
    ) {
      const el =
        target instanceof SVGElement
          ? ((target.closest(
              "[data-locatorjs-id], [data-locatorjs]"
            ) as HTMLElement | null) ??
            (target.closest("svg") as HTMLElement | null) ??
            (target as unknown as HTMLElement))
          : target;
      if (el && !isLocatorsOwnElement(el)) return el;
    }
    return null;
  }

  function clickListener(e: MouseEvent) {
    if (
      settingsOpen() &&
      !eventPathHasAttribute(e, "data-treelocator-settings-panel") &&
      !eventPathHasAttribute(e, "data-treelocator-settings-toggle")
    ) {
      setSettingsOpen(false);
    }

    // Handle recording element selection
    if (recording.recordingState() === "selecting") {
      e.preventDefault();
      e.stopPropagation();
      const element = findElementAtPoint(e);
      if (element && !isLocatorsOwnElement(element)) {
        recording.startRecording(element);
      }
      return;
    }

    // During recording, let clicks pass through (tracked by interaction logger)
    if (recording.recordingState() === "recording") return;

    if (!e.altKey && !isCombinationModifiersPressed(e) && !locatorActive()) {
      return;
    }

    const element = findElementAtPoint(e);

    if (!element) return;
    if (element instanceof HTMLElement && element.shadowRoot) return;
    if (isLocatorsOwnElement(element as HTMLElement)) return;

    e.preventDefault();
    e.stopPropagation();

    // Copy ancestry + computed styles to clipboard on alt+click
    const treeNode = createTreeNode(element as HTMLElement, props.adapterId);
    if (treeNode) {
      let ancestry = collectAncestry(treeNode);

      // Alt+Shift: keep from bottom up to the first element with a file, discard above
      if (e.shiftKey) {
        ancestry = truncateAtFirstFile(ancestry);
      }

      // Extract computed styles for the clicked element (if enabled)
      const stylesEnabled = settings().computedStyles;
      const elementLabel = getElementLabel(ancestry);
      const stylesResult = stylesEnabled
        ? extractComputedStyles(element as Element, elementLabel, {
            includeDefaults: settings().computedStylesIncludeDefaults,
          })
        : null;

      // Write immediately with component names (preserves user gesture for clipboard API)
      const formatted = formatAncestryChain(ancestry);
      const fullOutput = stylesResult
        ? formatted + "\n\n" + stylesResult.formatted
        : formatted;
      navigator.clipboard.writeText(fullOutput).then(() => {
        setToastMessage("Copied to clipboard");
      });

      // For React 19+: try to enrich with source map file paths and re-copy.
      // If the enriched label differs, re-extract with forceFull:true so the
      // diff-mode fast path doesn't collapse the second extraction (for the
      // same element within the diff window) into "No changes detected".
      enrichAncestryWithSourceMaps(ancestry, element as HTMLElement).then(
        (enriched) => {
          const enrichedFormatted = formatAncestryChain(enriched);
          if (enrichedFormatted !== formatted) {
            let enrichedFull = enrichedFormatted;
            if (stylesResult) {
              const enrichedLabel = getElementLabel(enriched);
              const enrichedStyles =
                enrichedLabel !== elementLabel
                  ? extractComputedStyles(element as Element, enrichedLabel, {
                      forceFull: true,
                      includeDefaults: settings().computedStylesIncludeDefaults,
                    }).formatted
                  : stylesResult.formatted;
              enrichedFull = enrichedFormatted + "\n\n" + enrichedStyles;
            }
            navigator.clipboard.writeText(enrichedFull).then(() => {
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

  function mouseOverListener(e: MouseEvent) {
    setHoldingModKey(e.altKey);
    setHoldingShift(e.shiftKey);

    // Don't update hovered element while recording — highlight is sticky
    if (recording.recordingState() === "recording") return;

    const element = findElementAtPoint(e);
    if (element) {
      setCurrentElement(element);
    }
  }

  useEventListeners({
    mouseOverListener,
    mouseMoveListener(e: MouseEvent) {
      setHoldingModKey(e.altKey);
      setHoldingShift(e.shiftKey);
    },
    keyDownListener(e: KeyboardEvent) {
      setHoldingModKey(isCombinationModifiersPressed(e, true));
      setHoldingShift(e.shiftKey);
      if (e.key === "Escape") {
        const wasSelecting = recording.recordingState() === "selecting";
        const wasLocatorActive = locatorActive();
        if (wasSelecting || wasLocatorActive) {
          e.preventDefault();
          e.stopPropagation();
          if (wasLocatorActive) setLocatorActive(false);
          if (wasSelecting) recording.handleRecordClick();
          setCurrentElement(null);
        }
      }
    },
    keyUpListener(e: KeyboardEvent) {
      setHoldingModKey(isCombinationModifiersPressed(e));
      setHoldingShift(e.shiftKey);
    },
    clickListener,
    mouseDownUpListener(e: MouseEvent) {
      setHoldingModKey(e.altKey);
      if (
        e.altKey ||
        locatorActive() ||
        recording.recordingState() === "selecting"
      ) {
        e.preventDefault();
        e.stopPropagation();
      }
    },
    scrollListener() {
      setCurrentElement(null);
    },
    onCleanup: recording.cleanup,
  });

  return (
    <>
      {isActive() ? (
        <MaybeOutline
          currentElement={currentElement()!}
          adapterId={props.adapterId}
          targets={props.targets}
          dashed={holdingShift()}
        />
      ) : null}
      {recording.recordingState() === "recording" &&
      recording.recordedElement() ? (
        <RecordingOutline element={recording.recordedElement()!} />
      ) : null}
      {recording.replayBox() ? (
        <div
          style={{
            position: "fixed",
            "z-index": "2147483645",
            left: recording.replayBox()!.x + "px",
            top: recording.replayBox()!.y + "px",
            width: recording.replayBox()!.w + "px",
            height: recording.replayBox()!.h + "px",
            "border-radius": "50%",
            "pointer-events": "none",
            background: "rgba(59, 130, 246, 0.4)",
            border: "2px solid #3b82f6",
            "box-shadow": "0 0 12px rgba(59, 130, 246, 0.5)",
          }}
        />
      ) : null}
      {recording.recordingState() === "results" ? (
        <RecordingResults
          findings={recording.recordingFindings()}
          summary={recording.recordingSummary()}
          data={recording.recordingData()}
          elementPath={recording.recordingElementPath()}
          interactions={recording.interactionLog()}
          visualDiff={recording.visualDiff()}
          onDismiss={recording.dismissResults}
          onReplay={recording.replayRecording}
          replaying={recording.replaying()}
          onToast={setToastMessage}
          hasPrevious={
            !recording.viewingPrevious() && recording.hasPreviousRecording()
          }
          onLoadPrevious={recording.loadPreviousRecording}
          hasNext={recording.viewingPrevious()}
          onLoadNext={recording.loadLatestRecording}
        />
      ) : null}
      {settingsOpen() ? (
        <SettingsPanel onDismiss={() => setSettingsOpen(false)} />
      ) : null}
      {toastMessage() && (
        <Toast
          message={toastMessage()!}
          onClose={() => setToastMessage(null)}
        />
      )}
      <RecordingPillButton
        locatorActive={locatorActive()}
        recordingState={recording.recordingState()}
        settingsOpen={settingsOpen()}
        onLocatorToggle={() => setLocatorActive(!locatorActive())}
        onRecordClick={recording.handleRecordClick}
        onSettingsClick={() => setSettingsOpen(!settingsOpen())}
      />
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
