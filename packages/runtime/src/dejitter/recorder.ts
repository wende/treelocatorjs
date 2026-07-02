/**
 * Dejitter — Animation frame recorder & jank detector
 *
 * Source of truth lives here. The upstream `dejitter` standalone project
 * (github.com/wende/dejitter, npm `dejitter`) is the historical seed; new
 * work happens in this package. Records every rAF at full speed, then
 * downsamples intelligently on getData().
 *
 * Diverges from upstream `dejitter` in two ways:
 * - Adds a `lag` detector (input-to-paint delay) and matching threshold.
 * - Threads `existingFindings` through shiver/jump/stutter/stuck so each
 *   prop only gets reported by the first detector that matches; the
 *   stutter detector also segments by `maxFrameGap` so a gap between two
 *   animations isn't read as a mid-motion reversal.
 *
 * Module layout:
 * - types.ts     — config/finding/summary types + DEFAULT_CONFIG
 * - numeric.ts   — pure numeric timeline helpers
 * - detectors.ts — anomaly detectors operating on an AnalysisContext
 * - recorder.ts  — rAF sampling loop, downsampling, public API
 */

import type {
  AnalysisContext,
  DejitterAPI,
  DejitterConfig,
  DejitterFinding,
  DejitterSummary,
  InteractionRecord,
  PropStats,
  RawFrame,
  TimelinePoint,
} from "./types";
import { DEFAULT_CONFIG } from "./types";
import { analyzeFindings } from "./detectors";

export type {
  DejitterAPI,
  DejitterConfig,
  DejitterFinding,
  DejitterSummary,
} from "./types";

export function createDejitterRecorder(): DejitterAPI {
  let config: DejitterConfig = { ...DEFAULT_CONFIG };
  let recording = false;
  let startTime = 0;
  let rafId: number | null = null;
  let stopTimer: ReturnType<typeof setTimeout> | null = null;
  let mutationObserver: MutationObserver | null = null;
  let interactionAbort: AbortController | null = null;
  let onStopCallbacks: Array<() => void> = [];

  let lastSeen = new Map<string, Record<string, any>>();
  let rawFrames: RawFrame[] = [];
  let lastChangeTime = 0;
  let hasSeenChange = false;
  let mutations: any[] = [];
  let interactions: InteractionRecord[] = [];
  let nextElemId = 0;

  function elemId(el: any): string {
    if (!el.__dj_id) {
      el.__dj_id = `e${nextElemId++}`;
      el.__dj_label = {
        tag: el.tagName.toLowerCase(),
        cls: (typeof el.className === 'string' ? el.className : '').slice(0, 80),
        text: (el.textContent || '').trim().slice(0, 60),
      };
    }
    return el.__dj_id;
  }

  function readProps(el: Element): Record<string, any> {
    const out: Record<string, any> = {};
    const computed = getComputedStyle(el);
    for (const p of config.props) {
      if (p === 'boundingRect') {
        const r = el.getBoundingClientRect();
        out['rect.x'] = Math.round(r.x);
        out['rect.y'] = Math.round(r.y);
        out['rect.w'] = Math.round(r.width);
        out['rect.h'] = Math.round(r.height);
      } else if (p === 'scroll') {
        out['scrollTop'] = Math.round(el.scrollTop);
        out['scrollHeight'] = Math.round(el.scrollHeight);
      } else if (p === 'textContent') {
        out['textLen'] = (el.textContent || '').length;
      } else {
        out[p] = computed.getPropertyValue(p);
      }
    }
    return out;
  }

  function computeDelta(id: string, current: Record<string, any>): Record<string, any> | null {
    const prev = lastSeen.get(id);
    if (!prev) {
      lastSeen.set(id, { ...current });
      return current;
    }
    const delta: Record<string, any> = {};
    let changed = false;
    for (const [k, v] of Object.entries(current)) {
      if (prev[k] !== v) {
        delta[k] = v;
        prev[k] = v;
        changed = true;
      }
    }
    return changed ? delta : null;
  }

  function sampleAll(): void {
    const t = Math.round(performance.now() - startTime);
    const elements = document.querySelectorAll(config.selector);
    const frameDelta: any[] = [];

    elements.forEach((el) => {
      if (config.minTextLength > 0) {
        if ((el.textContent || '').trim().length < config.minTextLength) return;
      }
      const id = elemId(el);
      const current = readProps(el);
      const delta = computeDelta(id, current);
      if (delta) {
        frameDelta.push({ id, ...delta });
      }
    });

    if (frameDelta.length > 0) {
      rawFrames.push({ t, changes: frameDelta });
      if (rawFrames.length > 1) hasSeenChange = true;
      lastChangeTime = performance.now();
    }
  }

  function loop(): void {
    if (!recording) return;

    if (config.idleTimeout > 0 && hasSeenChange) {
      if (performance.now() - lastChangeTime >= config.idleTimeout) {
        api.stop();
        return;
      }
    }

    sampleAll();
    rafId = requestAnimationFrame(loop);
  }

  function startMutationObserver(): void {
    if (!config.mutations) return;
    mutationObserver = new MutationObserver((muts) => {
      if (!recording) return;
      const t = Math.round(performance.now() - startTime);
      lastChangeTime = performance.now();
      hasSeenChange = true;
      for (const m of muts) {
        if (m.type === 'childList') {
          for (const node of m.addedNodes) {
            if (node.nodeType === 3) {
              const text = node.textContent?.trim();
              if (text) mutations.push({ t, type: 'text+', text: text.slice(0, 120), parent: (m.target as Element).tagName?.toLowerCase() });
            } else if (node.nodeType === 1) {
              const text = (node.textContent || '').trim().slice(0, 80);
              mutations.push({ t, type: 'node+', tag: (node as Element).tagName.toLowerCase(), text });
            }
          }
          for (const node of m.removedNodes) {
            if (node.nodeType === 1) {
              mutations.push({ t, type: 'node-', tag: (node as Element).tagName.toLowerCase(), text: (node.textContent || '').trim().slice(0, 40) });
            }
          }
        } else if (m.type === 'characterData') {
          const text = m.target.textContent?.trim();
          if (text) mutations.push({ t, type: 'text~', text: text.slice(0, 120), parent: m.target.parentElement?.tagName?.toLowerCase() });
        }
      }
    });
    mutationObserver.observe(document.body, {
      childList: true, subtree: true, characterData: true,
    });
  }

  function startInteractionListeners(): void {
    interactionAbort = new AbortController();
    const opts: AddEventListenerOptions & { signal: AbortSignal } = { capture: true, signal: interactionAbort.signal };
    const handler = (e: Event): void => {
      if (!recording) return;
      const t = Math.round(performance.now() - startTime);
      interactions.push({ t, type: e.type });
    };
    for (const evt of ['click', 'pointerdown', 'keydown'] as const) {
      document.addEventListener(evt, handler, opts);
    }
  }

  // --- Downsampling ---

  function targetOutputFrames(): number {
    const duration = rawFrames.length ? rawFrames[rawFrames.length - 1]!.t : 0;
    return Math.max(1, Math.round((duration / 1000) * config.sampleRate));
  }

  function downsample(): any[] {
    if (rawFrames.length === 0) return [];

    const targetFrames = targetOutputFrames();

    const changeIndex = new Map<string, Array<{ frameIdx: number; t: number; value: any }>>();

    for (let fi = 0; fi < rawFrames.length; fi++) {
      const frame = rawFrames[fi]!;
      for (const change of frame.changes) {
        const { id, ...props } = change;
        for (const [prop, value] of Object.entries(props)) {
          const key = `${id}.${prop}`;
          if (!changeIndex.has(key)) changeIndex.set(key, []);
          changeIndex.get(key)!.push({ frameIdx: fi, t: frame.t, value });
        }
      }
    }

    const outputEvents: Array<{ t: number; id: string; prop: string; value: any }> = [];

    for (const [key, changes] of changeIndex.entries()) {
      const dotIdx = key.indexOf('.');
      const id = key.slice(0, dotIdx);
      const prop = key.slice(dotIdx + 1);

      if (changes.length === 0) continue;

      if (changes.length <= targetFrames) {
        for (const c of changes) {
          outputEvents.push({ t: c.t, id, prop, value: c.value });
        }
      } else {
        for (let i = 0; i < targetFrames; i++) {
          const srcIdx = Math.round((i / (targetFrames - 1)) * (changes.length - 1));
          const c = changes[srcIdx]!;
          outputEvents.push({ t: c.t, id, prop, value: c.value });
        }
      }
    }

    outputEvents.sort((a, b) => a.t - b.t);
    const frames: any[] = [];
    let currentFrame: any = null;

    for (const evt of outputEvents) {
      if (!currentFrame || currentFrame.t !== evt.t) {
        currentFrame = { t: evt.t, changes: [] };
        frames.push(currentFrame);
      }
      let elemChange = currentFrame.changes.find((c: any) => c.id === evt.id);
      if (!elemChange) {
        elemChange = { id: evt.id };
        currentFrame.changes.push(elemChange);
      }
      elemChange[evt.prop] = evt.value;
    }

    return frames;
  }

  function buildElementMap(): Record<string, any> {
    const elements: Record<string, any> = {};
    const seenIds = new Set<string>();
    for (const f of rawFrames) {
      for (const c of f.changes) seenIds.add(c.id);
    }
    document.querySelectorAll('*').forEach((el: any) => {
      if (el.__dj_id && seenIds.has(el.__dj_id)) {
        elements[el.__dj_id] = el.__dj_label || {
          tag: el.tagName.toLowerCase(),
          text: (el.textContent || '').trim().slice(0, 60),
        };
      }
    });
    return elements;
  }

  function buildPropStats(): PropStats {
    const stats: Record<string, any> = {};
    const targetFrames = targetOutputFrames();

    for (const f of rawFrames) {
      for (const change of f.changes) {
        const { id, ...props } = change;
        for (const prop of Object.keys(props)) {
          const key = `${id}.${prop}`;
          if (!stats[key]) stats[key] = { elem: id, prop, raw: 0 };
          stats[key].raw++;
        }
      }
    }

    for (const s of Object.values(stats) as any[]) {
      if (s.raw === 0) {
        s.mode = 'dropped';
        s.output = 0;
      } else if (s.raw <= targetFrames) {
        s.mode = 'anomaly';
        s.output = s.raw;
      } else {
        s.mode = 'sampled';
        s.output = targetFrames;
      }
    }

    return { targetFrames, props: Object.values(stats) };
  }

  // --- Analysis ---

  function getTimeline(eId: string, prop: string): TimelinePoint[] {
    const timeline: TimelinePoint[] = [];
    for (const frame of rawFrames) {
      for (const c of frame.changes) {
        if (c.id === eId && c[prop] !== undefined) {
          timeline.push({ t: frame.t, value: c[prop] });
        }
      }
    }
    return timeline;
  }

  function buildAnalysisContext(): AnalysisContext {
    return {
      thresholds: config.thresholds,
      propStats: buildPropStats(),
      elements: buildElementMap(),
      interactions,
      rawFrames,
      getTimeline,
    };
  }

  // --- Public API ---

  const api: DejitterAPI = {
    configure(opts: Partial<DejitterConfig> = {}) {
      const { thresholds: userThresholds, ...rest } = opts;
      config = { ...DEFAULT_CONFIG, ...rest } as DejitterConfig;
      if (userThresholds) {
        config.thresholds = { ...DEFAULT_CONFIG.thresholds };
        for (const key of Object.keys(userThresholds) as Array<keyof typeof DEFAULT_CONFIG.thresholds>) {
          if (DEFAULT_CONFIG.thresholds[key]) {
            (config.thresholds as any)[key] = { ...DEFAULT_CONFIG.thresholds[key], ...(userThresholds as any)[key] };
          }
        }
      }
      return config;
    },

    start() {
      rawFrames = [];
      mutations = [];
      interactions = [];
      lastSeen = new Map();
      nextElemId = 0;
      recording = true;
      startTime = performance.now();
      lastChangeTime = performance.now();
      hasSeenChange = false;
      onStopCallbacks = [];

      startMutationObserver();
      startInteractionListeners();
      rafId = requestAnimationFrame(loop);

      if (config.maxDuration > 0) {
        stopTimer = setTimeout(() => api.stop(), config.maxDuration);
      }
      const elemCount = document.querySelectorAll(config.selector).length;
      return `Recording ${elemCount} elements (outputRate=${config.sampleRate}/s, max=${config.maxDuration}ms, idle=${config.idleTimeout}ms, props=[${config.props}], mutations=${config.mutations})`;
    },

    stop() {
      recording = false;
      if (rafId) cancelAnimationFrame(rafId);
      if (stopTimer) clearTimeout(stopTimer);
      mutationObserver?.disconnect();
      interactionAbort?.abort();

      const msg = `Stopped. ${rawFrames.length} raw frames, ${mutations.length} mutation events.`;

      for (const cb of onStopCallbacks) {
        try { cb(); } catch (e) { console.error('[dejitter] onStop callback error:', e); }
      }

      return msg;
    },

    onStop(callback) {
      onStopCallbacks.push(callback);
    },

    getData() {
      const samples = downsample();
      const elements = buildElementMap();
      const propStats = buildPropStats();

      return {
        config: { ...config },
        duration: rawFrames.length ? rawFrames[rawFrames.length - 1]!.t : 0,
        rawFrameCount: rawFrames.length,
        outputFrameCount: samples.length,
        mutationEvents: mutations.length,
        propStats,
        elements,
        samples,
        mutations,
      };
    },

    summary(json?) {
      const propStats = buildPropStats();
      const elements = buildElementMap();
      const byMode: Record<string, number> = { anomaly: 0, sampled: 0, dropped: 0 };
      for (const p of propStats.props) {
        byMode[p.mode!] = (byMode[p.mode!] || 0) + 1;
      }
      const data: DejitterSummary = {
        duration: rawFrames.length ? rawFrames[rawFrames.length - 1]!.t : 0,
        rawFrameCount: rawFrames.length,
        targetOutputFrames: propStats.targetFrames,
        mutationEvents: mutations.length,
        elementsTracked: Object.keys(elements).length,
        propBreakdown: byMode as any,
      };
      return json ? data : JSON.stringify(data, null, 2);
    },

    findings(json?) {
      const data = analyzeFindings(buildAnalysisContext()).map(
        ({ timeline, ...rest }) => rest
      ) as DejitterFinding[];
      return json ? data : JSON.stringify(data, null, 2);
    },

    getRaw() {
      return { rawFrames, mutations, interactions };
    },

    toJSON() {
      return JSON.stringify(api.getData(), null, 2);
    },
  };

  return api;
}
