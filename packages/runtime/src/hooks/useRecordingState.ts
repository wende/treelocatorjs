import { createSignal, type Accessor } from "solid-js";
import { AdapterId } from "../consts";
import {
  createDejitterRecorder,
  type DejitterAPI,
  type DejitterConfig,
  type DejitterFinding,
  type DejitterSummary,
} from "../dejitter/recorder";
import type { InteractionEvent } from "../components/RecordingResults";
import { isLocatorsOwnElement } from "../functions/isLocatorsOwnElement";
import {
  collectAncestry,
  formatAncestryChain,
  getElementLabel,
} from "../functions/formatAncestryChain";
import { createTreeNode } from "../adapters/createTreeNode";
import {
  loadFromStorage,
  saveToStorage,
  clearStorage,
  type SavedRecording,
} from "./useLocatorStorage";
import { settings } from "./useSettings";
import { takeSnapshot } from "../visualDiff/snapshot";
import { computeDiff, formatReport } from "../visualDiff/diff";
import type { DeltaReport, ElementSnapshot } from "../visualDiff/types";

export type RecordingState = "idle" | "selecting" | "recording" | "results";

/** Result of a completed recording session (also returned by replayWithRecord). */
export interface RecordingResult {
  path: string;
  findings: DejitterFinding[];
  summary: DejitterSummary | null;
  data: any;
  interactions: InteractionEvent[];
  visualDiff: DeltaReport | null;
}

function buildDejitterConfig(): Partial<DejitterConfig> {
  const s = settings();
  return {
    selector: "[data-treelocator-recording]",
    props: ["opacity", "transform", "boundingRect", "width", "height"],
    sampleRate: s.sampleRate,
    maxDuration: s.maxDurationMs,
    idleTimeout: 0,
    mutations: true,
    thresholds: {
      jump: { minAbsolute: s.jumpMinAbsolute },
      lag: { minDelay: s.lagMinDelay },
    },
  } as Partial<DejitterConfig>;
}

export interface RecordingStateAPI {
  recordingState: Accessor<RecordingState>;
  recordedElement: Accessor<HTMLElement | null>;
  recordingFindings: Accessor<DejitterFinding[]>;
  recordingSummary: Accessor<DejitterSummary | null>;
  recordingData: Accessor<any>;
  recordingElementPath: Accessor<string>;
  interactionLog: Accessor<InteractionEvent[]>;
  visualDiff: Accessor<DeltaReport | null>;
  replayBox: Accessor<{ x: number; y: number; w: number; h: number } | null>;
  replaying: Accessor<boolean>;
  viewingPrevious: Accessor<boolean>;
  handleRecordClick: () => void;
  startRecording: (element: HTMLElement) => void;
  stopRecording: () => Promise<void>;
  replayRecording: () => void;
  stopReplay: () => void;
  replayWithRecord: (
    elementOrSelector: HTMLElement | string
  ) => Promise<RecordingResult | null>;
  dismissResults: () => void;
  hasPreviousRecording: () => boolean;
  loadPreviousRecording: () => void;
  loadLatestRecording: () => void;
  cleanup: () => void;
}

export function useRecordingState(adapterId?: AdapterId): RecordingStateAPI {
  // Restore last results on mount
  const restored = loadFromStorage();
  const restoredLast = restored.last;

  const [recordingState, setRecordingState] = createSignal<RecordingState>(
    restoredLast ? "results" : "idle"
  );
  const [recordedElement, setRecordedElement] =
    createSignal<HTMLElement | null>(null);
  const [recordingFindings, setRecordingFindings] = createSignal<
    DejitterFinding[]
  >(restoredLast?.findings ?? []);
  const [recordingSummary, setRecordingSummary] =
    createSignal<DejitterSummary | null>(restoredLast?.summary ?? null);
  const [interactionLog, setInteractionLog] = createSignal<InteractionEvent[]>(
    restoredLast?.interactions ?? []
  );
  const [recordingData, setRecordingData] = createSignal<any>(
    restoredLast?.data ?? null
  );
  const [recordingElementPath, setRecordingElementPath] = createSignal<string>(
    restoredLast?.elementPath ?? ""
  );
  const [visualDiff, setVisualDiff] = createSignal<DeltaReport | null>(
    restoredLast?.visualDiff ?? null
  );
  const [replayBox, setReplayBox] = createSignal<{
    x: number;
    y: number;
    w: number;
    h: number;
  } | null>(null);
  const [replaying, setReplaying] = createSignal(false);
  const [viewingPrevious, setViewingPrevious] = createSignal(false);

  let dejitterInstance: DejitterAPI | null = null;
  let interactionClickHandler: ((e: MouseEvent) => void) | null = null;
  let recordingStartTime = 0;
  let recordingStartPerf = 0;
  let replayTimerId: number | null = null;
  let visualDiffContext: {
    before: ElementSnapshot[];
    beforeElements: Map<string, HTMLElement | SVGElement>;
    root: HTMLElement;
  } | null = null;

  function componentLabelFor(el: HTMLElement | SVGElement): string | null {
    if (!(el instanceof HTMLElement)) return null;
    const node = createTreeNode(el, adapterId);
    if (!node) return null;
    const ancestry = collectAncestry(node);
    const label = getElementLabel(ancestry);
    return label || null;
  }

  function enrichEntryLabels(
    report: DeltaReport,
    beforeElements: Map<string, HTMLElement | SVGElement>,
    afterElements: Map<string, HTMLElement | SVGElement>
  ): void {
    for (const entry of report.entries) {
      const el =
        entry.type === "-"
          ? beforeElements.get(entry.key)
          : afterElements.get(entry.key) ?? beforeElements.get(entry.key);
      if (!el) continue;
      const label = componentLabelFor(el);
      if (label) entry.label = label;
    }
  }

  function finalizeVisualDiff(): DeltaReport | null {
    if (!visualDiffContext) return null;
    const { before, beforeElements, root } = visualDiffContext;
    visualDiffContext = null;
    const afterElements = new Map<string, HTMLElement | SVGElement>();
    const after = takeSnapshot(root, afterElements);
    const report = computeDiff(before, after);
    enrichEntryLabels(report, beforeElements, afterElements);
    report.elapsedMs = performance.now() - recordingStartPerf;
    report.settle = "clean";
    report.text = formatReport(report.entries, {
      elapsedMs: report.elapsedMs,
      settle: "clean",
    });
    return report;
  }

  function collectElementPath(el: HTMLElement): string {
    const treeNode = createTreeNode(el, adapterId);
    if (treeNode) {
      const ancestry = collectAncestry(treeNode);
      return formatAncestryChain(ancestry);
    }
    return "";
  }

  // --- Recording lifecycle ---

  /**
   * Mark the element, capture the visual-diff baseline, and start the
   * dejitter recorder. Shared by user-initiated recording and replayWithRecord.
   */
  function beginSession(element: HTMLElement): void {
    element.setAttribute("data-treelocator-recording", "true");
    setRecordedElement(element);

    recordingStartPerf = performance.now();
    if (settings().visualDiff) {
      const beforeElements = new Map<string, HTMLElement | SVGElement>();
      visualDiffContext = {
        before: takeSnapshot(element, beforeElements),
        beforeElements,
        root: element,
      };
    } else {
      visualDiffContext = null;
    }

    dejitterInstance = createDejitterRecorder();
    dejitterInstance.configure(buildDejitterConfig());
    dejitterInstance.start();
    setRecordingState("recording");
  }

  /**
   * Stop the dejitter recorder, collect findings/summary/visual diff, publish
   * everything to the signals + storage, and move to the results state.
   * Returns null when no recording session is active.
   */
  function finalizeSession(events: InteractionEvent[]): RecordingResult | null {
    const instance = dejitterInstance;
    if (!instance) return null;
    dejitterInstance = null;
    instance.stop();

    const anomalyEnabled = settings().anomalyTracking;
    const findings = anomalyEnabled
      ? (instance.findings(true) as DejitterFinding[])
      : [];
    const summary = instance.summary(true) as DejitterSummary;
    const data = anomalyEnabled ? instance.getData() : null;

    const el = recordedElement();
    const elementPath = el ? collectElementPath(el) : "";
    const diffReport = finalizeVisualDiff();

    setRecordingFindings(findings);
    setRecordingSummary(summary);
    setRecordingData(data);
    setRecordingElementPath(elementPath);
    setInteractionLog(events);
    setVisualDiff(diffReport);

    saveToStorage({
      findings,
      summary,
      data,
      elementPath,
      interactions: events,
      visualDiff: diffReport,
    });

    el?.removeAttribute("data-treelocator-recording");
    setRecordingState("results");

    return {
      path: elementPath,
      findings,
      summary,
      data,
      interactions: events,
      visualDiff: diffReport,
    };
  }

  function handleRecordClick() {
    switch (recordingState()) {
      case "idle":
        setRecordingState("selecting");
        break;
      case "selecting":
        setRecordingState("idle");
        break;
      case "recording":
        stopRecording();
        break;
      case "results":
        dismissResults();
        setRecordingState("selecting");
        break;
    }
  }

  function startRecording(element: HTMLElement) {
    beginSession(element);
    startInteractionTracker();
  }

  async function stopRecording() {
    const events = interactionLog();
    stopInteractionTracker();
    finalizeSession(events);
  }

  // --- Replay ---

  /**
   * Dispatch the recorded clicks at their original positions and timing,
   * showing the pulse indicator for each. Calls onDone after the last event
   * (delayed by doneDelayMs so trailing animations are still captured).
   */
  function playEvents(
    events: InteractionEvent[],
    onDone: () => void,
    doneDelayMs = 0
  ): void {
    let eventIdx = 0;

    function scheduleNext() {
      if (eventIdx >= events.length) {
        if (doneDelayMs > 0) {
          replayTimerId = window.setTimeout(onDone, doneDelayMs);
        } else {
          onDone();
        }
        return;
      }

      const evt = events[eventIdx]!;
      const delay = eventIdx === 0 ? 100 : evt.t - events[eventIdx - 1]!.t;

      replayTimerId = window.setTimeout(() => {
        setReplayBox({ x: evt.x - 12, y: evt.y - 12, w: 24, h: 24 });

        const target = document.elementFromPoint(evt.x, evt.y);
        if (target) {
          target.dispatchEvent(
            new MouseEvent("click", {
              bubbles: true,
              cancelable: true,
              clientX: evt.x,
              clientY: evt.y,
              view: window,
            })
          );
        }

        window.setTimeout(() => setReplayBox(null), 200);

        eventIdx++;
        scheduleNext();
      }, Math.max(delay, 50));
    }

    scheduleNext();
  }

  function replayRecording() {
    const events = interactionLog();
    if (events.length === 0) return;

    stopReplay();
    setReplaying(true);
    playEvents(events, stopReplay);
  }

  function stopReplay() {
    if (replayTimerId) {
      clearTimeout(replayTimerId);
      replayTimerId = null;
    }
    setReplaying(false);
    setReplayBox(null);
  }

  function replayWithRecord(
    elementOrSelector: HTMLElement | string
  ): Promise<RecordingResult | null> {
    let element: HTMLElement | null;
    if (typeof elementOrSelector === "string") {
      const found = document.querySelector(elementOrSelector);
      element = found instanceof HTMLElement ? found : null;
    } else {
      element = elementOrSelector;
    }
    if (!element) return Promise.resolve(null);

    const stored = loadFromStorage();
    const events = stored.last?.interactions ?? interactionLog();
    if (events.length === 0) return Promise.resolve(null);

    return new Promise((resolve) => {
      beginSession(element!);
      setReplaying(true);

      // Wait 500ms after the last replayed click so trailing animations are
      // captured before the recording is finalized.
      playEvents(
        events,
        () => {
          setReplaying(false);
          setReplayBox(null);
          resolve(finalizeSession(events));
        },
        500
      );
    });
  }

  function dismissResults() {
    stopReplay();
    setRecordingFindings([]);
    setRecordingSummary(null);
    setRecordingData(null);
    setRecordingElementPath("");
    setInteractionLog([]);
    setVisualDiff(null);
    setRecordedElement(null);
    setViewingPrevious(false);
    setRecordingState("idle");
    clearStorage();
  }

  // --- Stored recordings ---

  function applyStoredRecording(
    stored: SavedRecording,
    isPrevious: boolean
  ): void {
    setRecordingFindings(stored.findings);
    setRecordingSummary(stored.summary);
    setRecordingData(stored.data);
    setRecordingElementPath(stored.elementPath);
    setInteractionLog(stored.interactions);
    setVisualDiff(stored.visualDiff ?? null);
    setViewingPrevious(isPrevious);
    setRecordingState("results");
  }

  function hasPreviousRecording(): boolean {
    return loadFromStorage().previous !== null;
  }

  function loadPreviousRecording() {
    const stored = loadFromStorage();
    if (stored.previous) applyStoredRecording(stored.previous, true);
  }

  function loadLatestRecording() {
    const stored = loadFromStorage();
    if (stored.last) applyStoredRecording(stored.last, false);
  }

  // --- Interaction tracking ---

  function startInteractionTracker() {
    recordingStartTime = performance.now();
    setInteractionLog([]);
    interactionClickHandler = (e: MouseEvent) => {
      if (isLocatorsOwnElement(e.target as HTMLElement)) return;
      const el = e.target as HTMLElement;
      const tag = el.tagName?.toLowerCase() || "unknown";
      const id = el.id ? "#" + el.id : "";
      const cls =
        el.className && typeof el.className === "string"
          ? "." + el.className.split(" ")[0]
          : "";
      setInteractionLog((prev) => [
        ...prev,
        {
          t: Math.round(performance.now() - recordingStartTime),
          type: "click",
          target: `${tag}${id}${cls}`,
          x: e.clientX,
          y: e.clientY,
        },
      ]);
    };
    document.addEventListener("click", interactionClickHandler, {
      capture: true,
    });
  }

  function stopInteractionTracker() {
    if (interactionClickHandler) {
      document.removeEventListener("click", interactionClickHandler, {
        capture: true,
      });
      interactionClickHandler = null;
    }
  }

  function cleanup() {
    stopReplay();
    stopInteractionTracker();
  }

  return {
    recordingState,
    recordedElement,
    recordingFindings,
    recordingSummary,
    recordingData,
    recordingElementPath,
    interactionLog,
    visualDiff,
    replayBox,
    replaying,
    viewingPrevious,
    handleRecordClick,
    startRecording,
    stopRecording,
    replayRecording,
    stopReplay,
    replayWithRecord,
    dismissResults,
    hasPreviousRecording,
    loadPreviousRecording,
    loadLatestRecording,
    cleanup,
  };
}
