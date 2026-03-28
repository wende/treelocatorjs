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
import { createDejitterRecorder, DejitterAPI, DejitterFinding, DejitterSummary } from "../dejitter/recorder";
import { RecordingOutline } from "./RecordingOutline";
import { RecordingResults, InteractionEvent } from "./RecordingResults";

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

  // Recording state machine: idle -> selecting -> recording -> results -> idle
  type RecordingState = 'idle' | 'selecting' | 'recording' | 'results';

  // --- localStorage persistence ---
  const STORAGE_KEY = '__treelocator_recording__';

  type SavedRecording = {
    findings: DejitterFinding[];
    summary: DejitterSummary | null;
    data: any;
    elementPath: string;
    interactions: InteractionEvent[];
  };

  function loadFromStorage(): { last: SavedRecording | null; previous: SavedRecording | null } {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return { last: null, previous: null };
  }

  function saveToStorage(current: SavedRecording) {
    try {
      const stored = loadFromStorage();
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        last: current,
        previous: stored.last,
      }));
    } catch {}
  }

  // Restore last results on mount
  const restored = loadFromStorage();
  const restoredLast = restored.last;

  const [recordingState, setRecordingState] = createSignal<RecordingState>(restoredLast ? 'results' : 'idle');
  const [recordedElement, setRecordedElement] = createSignal<HTMLElement | null>(null);
  const [recordingFindings, setRecordingFindings] = createSignal<DejitterFinding[]>(restoredLast?.findings ?? []);
  const [recordingSummary, setRecordingSummary] = createSignal<DejitterSummary | null>(restoredLast?.summary ?? null);
  const [interactionLog, setInteractionLog] = createSignal<InteractionEvent[]>(restoredLast?.interactions ?? []);
  const [recordingData, setRecordingData] = createSignal<any>(restoredLast?.data ?? null);
  const [recordingElementPath, setRecordingElementPath] = createSignal<string>(restoredLast?.elementPath ?? "");
  const [replayBox, setReplayBox] = createSignal<{ x: number; y: number; w: number; h: number } | null>(null);
  const [replaying, setReplaying] = createSignal(false);
  let dejitterInstance: DejitterAPI | null = null;
  let interactionClickHandler: ((e: MouseEvent) => void) | null = null;
  let recordingStartTime = 0;
  let replayTimerId: number | null = null;

  const isActive = () => (holdingModKey() || locatorActive() || recordingState() === 'selecting') && currentElement();

  createEffect(() => {
    if (isActive()) {
      document.body.classList.add("locatorjs-active-pointer");
    } else {
      document.body.classList.remove("locatorjs-active-pointer");
    }
  });

  // Expose replay functions on the browser API
  if (typeof window !== "undefined" && (window as any).__treelocator__) {
    (window as any).__treelocator__.replay = () => replayRecording();
    (window as any).__treelocator__.replayWithRecord = (elementOrSelector: HTMLElement | string) =>
      replayWithRecord(elementOrSelector);
  }

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

  function findElementAtPoint(e: MouseEvent): HTMLElement | null {
    const elementsAtPoint = document.elementsFromPoint(e.clientX, e.clientY);
    for (const el of elementsAtPoint) {
      if (isLocatorsOwnElement(el as HTMLElement)) continue;
      if (el instanceof HTMLElement || el instanceof SVGElement) {
        const withLocator = el.closest('[data-locatorjs-id], [data-locatorjs]');
        if (withLocator) return withLocator as HTMLElement;
      }
    }
    // Fallback to e.target
    const target = e.target;
    if (target && (target instanceof HTMLElement || target instanceof SVGElement)) {
      const el = target instanceof SVGElement
        ? (target.closest('[data-locatorjs-id], [data-locatorjs]') as HTMLElement | null) ??
          (target.closest('svg') as HTMLElement | null) ??
          (target as unknown as HTMLElement)
        : target;
      if (el && !isLocatorsOwnElement(el)) return el;
    }
    return null;
  }

  // --- Recording lifecycle ---

  function handleRecordClick() {
    switch (recordingState()) {
      case 'idle':
        setRecordingState('selecting');
        break;
      case 'selecting':
        setRecordingState('idle');
        break;
      case 'recording':
        stopRecording();
        break;
      case 'results':
        dismissResults();
        break;
    }
  }

  function startRecording(element: HTMLElement) {
    element.setAttribute('data-treelocator-recording', 'true');
    setRecordedElement(element);

    dejitterInstance = createDejitterRecorder();
    dejitterInstance.configure({
      selector: '[data-treelocator-recording]',
      props: ['opacity', 'transform', 'boundingRect', 'width', 'height'],
      sampleRate: 15,
      maxDuration: 30000,
      idleTimeout: 0,
      mutations: true,
    });
    dejitterInstance.start();
    startInteractionTracker();
    setRecordingState('recording');
  }

  function stopRecording() {
    if (!dejitterInstance) return;
    dejitterInstance.stop();
    const findings = dejitterInstance.findings(true) as DejitterFinding[];
    const summary = dejitterInstance.summary(true) as DejitterSummary;
    const data = dejitterInstance.getData();

    // Collect ancestry path from treelocator before clearing
    const el = recordedElement();
    let elementPath = "";
    if (el) {
      const treeNode = createTreeNode(el, props.adapterId);
      if (treeNode) {
        const ancestry = collectAncestry(treeNode);
        elementPath = formatAncestryChain(ancestry);
      }
    }

    setRecordingFindings(findings);
    setRecordingSummary(summary);
    setRecordingData(data);
    setRecordingElementPath(elementPath);
    stopInteractionTracker();

    // Persist to localStorage (moves previous "last" to "previous")
    saveToStorage({
      findings,
      summary,
      data,
      elementPath,
      interactions: interactionLog(),
    });

    el?.removeAttribute('data-treelocator-recording');
    setRecordingState('results');
    dejitterInstance = null;
  }

  function replayRecording() {
    const events = interactionLog();
    if (events.length === 0) return;

    stopReplay();
    setReplaying(true);

    let eventIdx = 0;

    function scheduleNext() {
      if (eventIdx >= events.length) {
        stopReplay();
        return;
      }

      const evt = events[eventIdx]!;
      const delay = eventIdx === 0 ? 100 : evt.t - events[eventIdx - 1]!.t;

      replayTimerId = window.setTimeout(() => {
        // Show click indicator
        setReplayBox({ x: evt.x - 12, y: evt.y - 12, w: 24, h: 24 });

        // Dispatch a real click at the recorded position
        const target = document.elementFromPoint(evt.x, evt.y);
        if (target) {
          target.dispatchEvent(new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            clientX: evt.x,
            clientY: evt.y,
            view: window,
          }));
        }

        // Clear click indicator after a short flash
        window.setTimeout(() => setReplayBox(null), 200);

        eventIdx++;
        scheduleNext();
      }, Math.max(delay, 50));
    }

    scheduleNext();
  }

  function stopReplay() {
    if (replayTimerId) {
      clearTimeout(replayTimerId);
      replayTimerId = null;
    }
    setReplaying(false);
    setReplayBox(null);
  }

  function replayWithRecord(elementOrSelector: HTMLElement | string): Promise<{
    path: string;
    findings: DejitterFinding[];
    summary: DejitterSummary | null;
    data: any;
    interactions: InteractionEvent[];
  } | null> {
    // Resolve element
    let element: HTMLElement | null;
    if (typeof elementOrSelector === 'string') {
      const found = document.querySelector(elementOrSelector);
      element = found instanceof HTMLElement ? found : null;
    } else {
      element = elementOrSelector;
    }
    if (!element) return Promise.resolve(null);

    // Get stored interactions to replay
    const stored = loadFromStorage();
    const events = stored.last?.interactions ?? interactionLog();
    if (events.length === 0) return Promise.resolve(null);

    return new Promise((resolve) => {
      // Start recording on the element
      element!.setAttribute('data-treelocator-recording', 'true');
      setRecordedElement(element);

      dejitterInstance = createDejitterRecorder();
      dejitterInstance.configure({
        selector: '[data-treelocator-recording]',
        props: ['opacity', 'transform', 'boundingRect', 'width', 'height'],
        sampleRate: 15,
        maxDuration: 30000,
        idleTimeout: 0,
        mutations: true,
      });
      dejitterInstance.start();
      setRecordingState('recording');
      setReplaying(true);

      let eventIdx = 0;

      function finishRecording() {
        setReplaying(false);
        setReplayBox(null);

        if (!dejitterInstance) { resolve(null); return; }
        dejitterInstance.stop();
        const findings = dejitterInstance.findings(true) as DejitterFinding[];
        const summary = dejitterInstance.summary(true) as DejitterSummary;
        const data = dejitterInstance.getData();

        const el = recordedElement();
        let elementPath = "";
        if (el) {
          const treeNode = createTreeNode(el, props.adapterId);
          if (treeNode) {
            const ancestry = collectAncestry(treeNode);
            elementPath = formatAncestryChain(ancestry);
          }
        }

        setRecordingFindings(findings);
        setRecordingSummary(summary);
        setRecordingData(data);
        setRecordingElementPath(elementPath);
        setInteractionLog(events);

        saveToStorage({ findings, summary, data, elementPath, interactions: events });

        el?.removeAttribute('data-treelocator-recording');
        setRecordingState('results');
        dejitterInstance = null;

        resolve({ path: elementPath, findings, summary, data, interactions: events });
      }

      function scheduleNext() {
        if (eventIdx >= events.length) {
          // Wait for CSS transitions to settle before stopping recording
          replayTimerId = window.setTimeout(finishRecording, 500);
          return;
        }

        const evt = events[eventIdx]!;
        const delay = eventIdx === 0 ? 100 : evt.t - events[eventIdx - 1]!.t;

        replayTimerId = window.setTimeout(() => {
          setReplayBox({ x: evt.x - 12, y: evt.y - 12, w: 24, h: 24 });

          const target = document.elementFromPoint(evt.x, evt.y);
          if (target) {
            target.dispatchEvent(new MouseEvent('click', {
              bubbles: true,
              cancelable: true,
              clientX: evt.x,
              clientY: evt.y,
              view: window,
            }));
          }

          window.setTimeout(() => setReplayBox(null), 200);

          eventIdx++;
          scheduleNext();
        }, Math.max(delay, 50));
      }

      scheduleNext();
    });
  }

  function dismissResults() {
    stopReplay();
    setRecordingFindings([]);
    setRecordingSummary(null);
    setRecordingData(null);
    setRecordingElementPath("");
    setInteractionLog([]);
    setRecordedElement(null);
    setRecordingState('idle');
  }

  function hasPreviousRecording(): boolean {
    return loadFromStorage().previous !== null;
  }

  function loadPreviousRecording() {
    const stored = loadFromStorage();
    if (!stored.previous) return;
    const prev = stored.previous;
    setRecordingFindings(prev.findings);
    setRecordingSummary(prev.summary);
    setRecordingData(prev.data);
    setRecordingElementPath(prev.elementPath);
    setInteractionLog(prev.interactions);
    setRecordingState('results');
  }

  function startInteractionTracker() {
    recordingStartTime = performance.now();
    setInteractionLog([]);
    interactionClickHandler = (e: MouseEvent) => {
      if (isLocatorsOwnElement(e.target as HTMLElement)) return;
      const el = e.target as HTMLElement;
      const tag = el.tagName?.toLowerCase() || 'unknown';
      const id = el.id ? '#' + el.id : '';
      const cls = el.className && typeof el.className === 'string' ? '.' + el.className.split(' ')[0] : '';
      setInteractionLog((prev) => [...prev, {
        t: Math.round(performance.now() - recordingStartTime),
        type: 'click',
        target: `${tag}${id}${cls}`,
        x: e.clientX,
        y: e.clientY,
      }]);
    };
    document.addEventListener('click', interactionClickHandler, { capture: true });
  }

  function stopInteractionTracker() {
    if (interactionClickHandler) {
      document.removeEventListener('click', interactionClickHandler, { capture: true });
      interactionClickHandler = null;
    }
  }

  function mouseOverListener(e: MouseEvent) {
    setHoldingModKey(e.altKey);

    // Don't update hovered element while recording -- highlight is sticky
    if (recordingState() === 'recording') return;

    const element = findElementAtPoint(e);
    if (element) {
      setCurrentElement(element);
    }
  }

  function mouseDownUpListener(e: MouseEvent) {
    setHoldingModKey(e.altKey);

    if (e.altKey || locatorActive() || recordingState() === 'selecting') {
      e.preventDefault();
      e.stopPropagation();
    }
  }

  function clickListener(e: MouseEvent) {
    // Handle recording element selection
    if (recordingState() === 'selecting') {
      e.preventDefault();
      e.stopPropagation();
      const element = findElementAtPoint(e);
      if (element && !isLocatorsOwnElement(element)) {
        startRecording(element);
      }
      return;
    }

    // During recording, let clicks pass through (tracked by interaction logger)
    if (recordingState() === 'recording') return;

    if (!e.altKey && !isCombinationModifiersPressed(e) && !locatorActive()) {
      return;
    }

    const element = findElementAtPoint(e);

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
      {recordingState() === 'recording' && recordedElement() ? (
        <RecordingOutline element={recordedElement()!} />
      ) : null}
      {replayBox() ? (
        <div
          style={{
            position: "fixed",
            "z-index": "2147483645",
            left: replayBox()!.x + "px",
            top: replayBox()!.y + "px",
            width: replayBox()!.w + "px",
            height: replayBox()!.h + "px",
            "border-radius": "50%",
            "pointer-events": "none",
            background: "rgba(59, 130, 246, 0.4)",
            border: "2px solid #3b82f6",
            "box-shadow": "0 0 12px rgba(59, 130, 246, 0.5)",
          }}
        />
      ) : null}
      {recordingState() === 'results' ? (
        <RecordingResults
          findings={recordingFindings()}
          summary={recordingSummary()}
          data={recordingData()}
          elementPath={recordingElementPath()}
          interactions={interactionLog()}
          onDismiss={dismissResults}
          onReplay={replayRecording}
          replaying={replaying()}
          onToast={setToastMessage}
          hasPrevious={hasPreviousRecording()}
          onLoadPrevious={loadPreviousRecording}
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
        <style>{`
          @keyframes treelocator-rec-pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.3; }
          }
        `}</style>
        <div style={{ display: "flex", gap: "8px", "align-items": "center" }}>
          {/* Tree icon button */}
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
              alt="TreeLocatorJS"
              width={51}
              height={51}
            />
          </div>
          {/* Record button */}
          <div
            class="rounded-full shadow-lg flex items-center justify-center cursor-pointer"
            style={{
              width: "54px",
              height: "54px",
              background: recordingState() === 'recording' ? "#ef4444" : "#ffffff",
              "box-shadow": recordingState() === 'selecting'
                ? "0 0 0 3px #3b82f6, 0 4px 14px rgba(0, 0, 0, 0.25)"
                : recordingState() === 'recording'
                ? "0 0 0 3px #ef4444, 0 4px 14px rgba(0, 0, 0, 0.25)"
                : "0 4px 14px rgba(0, 0, 0, 0.25)",
              transition: "transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out, background 0.2s ease-in-out",
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.25)"}
            onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
            onClick={handleRecordClick}
            aria-label={
              recordingState() === 'idle' ? "Record element changes. API: window.__treelocator__.replayWithRecord(selector)" :
              recordingState() === 'selecting' ? "Cancel recording selection" :
              recordingState() === 'recording' ? "Stop recording" :
              "Dismiss results"
            }
            role="button"
          >
            {recordingState() === 'recording' ? (
              /* Stop icon: white square */
              <div style={{ width: "20px", height: "20px", background: "#fff", "border-radius": "3px" }} />
            ) : (
              /* Record icon: red circle */
              <div
                style={{
                  width: "20px",
                  height: "20px",
                  background: "#ef4444",
                  "border-radius": "50%",
                  animation: recordingState() === 'selecting' ? "treelocator-rec-pulse 1s ease-in-out infinite" : "none",
                }}
              />
            )}
          </div>
        </div>
        <div
          role="note"
          aria-label="TreeLocatorJS Developer Tool API — Run: window.__treelocator__.help() for full usage instructions. Quick start: window.__treelocator__.getPath('button.submit') returns component ancestry. window.__treelocator__.replayWithRecord('.my-element') replays recorded interactions while tracking visual changes."
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
        >
          TreeLocatorJS: Run window.__treelocator__.help() for API docs
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
