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
import { collectAncestry, formatAncestryChain } from "../functions/formatAncestryChain";
import { createTreeNode } from "../adapters/createTreeNode";
import {
  loadFromStorage,
  saveToStorage,
  clearStorage,
} from "./useLocatorStorage";
import { settings } from "./useSettings";
import { takeSnapshot } from "../visualDiff/snapshot";
import { computeDiff, formatReport } from "../visualDiff/diff";
import { waitForSettle } from "../visualDiff/settle";
import type { DeltaReport, ElementSnapshot } from "../visualDiff/types";

export type RecordingState = "idle" | "selecting" | "recording" | "results";

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
  ) => Promise<{
    path: string;
    findings: DejitterFinding[];
    summary: DejitterSummary | null;
    data: any;
    interactions: InteractionEvent[];
    visualDiff: DeltaReport | null;
  } | null>;
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
    root: HTMLElement;
  } | null = null;

  async function finalizeVisualDiff(): Promise<DeltaReport | null> {
    if (!visualDiffContext) return null;
    const { before, root } = visualDiffContext;
    visualDiffContext = null;
    const settle = await waitForSettle(1000, root);
    const after = takeSnapshot(root);
    const report = computeDiff(before, after);
    report.elapsedMs = performance.now() - recordingStartPerf;
    report.settle = settle;
    report.text = formatReport(report.entries, {
      elapsedMs: report.elapsedMs,
      settle,
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
    element.setAttribute("data-treelocator-recording", "true");
    setRecordedElement(element);

    recordingStartPerf = performance.now();
    visualDiffContext = settings().visualDiff
      ? { before: takeSnapshot(element), root: element }
      : null;

    dejitterInstance = createDejitterRecorder();
    dejitterInstance.configure(buildDejitterConfig());
    dejitterInstance.start();
    startInteractionTracker();
    setRecordingState("recording");
  }

  async function stopRecording() {
    const instance = dejitterInstance;
    if (!instance) return;
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

    stopInteractionTracker();
    const diffReport = await finalizeVisualDiff();

    setRecordingFindings(findings);
    setRecordingSummary(summary);
    setRecordingData(data);
    setRecordingElementPath(elementPath);
    setVisualDiff(diffReport);

    saveToStorage({
      findings,
      summary,
      data,
      elementPath,
      interactions: interactionLog(),
      visualDiff: diffReport,
    });

    el?.removeAttribute("data-treelocator-recording");
    setRecordingState("results");
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
  ): Promise<{
    path: string;
    findings: DejitterFinding[];
    summary: DejitterSummary | null;
    data: any;
    interactions: InteractionEvent[];
    visualDiff: DeltaReport | null;
  } | null> {
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
      element!.setAttribute("data-treelocator-recording", "true");
      setRecordedElement(element);

      recordingStartPerf = performance.now();
      visualDiffContext = settings().visualDiff
        ? { before: takeSnapshot(element!), root: element! }
        : null;

      dejitterInstance = createDejitterRecorder();
      dejitterInstance.configure(buildDejitterConfig());
      dejitterInstance.start();
      setRecordingState("recording");
      setReplaying(true);

      let eventIdx = 0;

      async function finishRecording() {
        setReplaying(false);
        setReplayBox(null);

        const instance = dejitterInstance;
        if (!instance) {
          resolve(null);
          return;
        }
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

        const diffReport = await finalizeVisualDiff();

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

        resolve({
          path: elementPath,
          findings,
          summary,
          data,
          interactions: events,
          visualDiff: diffReport,
        });
      }

      function scheduleNext() {
        if (eventIdx >= events.length) {
          replayTimerId = window.setTimeout(finishRecording, 500);
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
    setVisualDiff(prev.visualDiff ?? null);
    setViewingPrevious(true);
    setRecordingState("results");
  }

  function loadLatestRecording() {
    const stored = loadFromStorage();
    if (!stored.last) return;
    const last = stored.last;
    setRecordingFindings(last.findings);
    setRecordingSummary(last.summary);
    setRecordingData(last.data);
    setRecordingElementPath(last.elementPath);
    setInteractionLog(last.interactions);
    setVisualDiff(last.visualDiff ?? null);
    setViewingPrevious(false);
    setRecordingState("results");
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
