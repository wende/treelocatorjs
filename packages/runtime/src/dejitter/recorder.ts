/**
 * Dejitter — Animation frame recorder & jank detector (vendored)
 *
 * Ported from dejitter/recorder.js as an ES module factory.
 * Records every rAF at full speed, then downsamples intelligently on getData().
 */

export interface DejitterConfig {
  selector: string;
  props: string[];
  sampleRate: number;
  maxDuration: number;
  minTextLength: number;
  mutations: boolean;
  idleTimeout: number;
  thresholds: {
    jitter: { minDeviation: number; maxDuration: number; highSeverity: number; medSeverity: number };
    shiver: { minReversals: number; minDensity: number; highDensity: number; medDensity: number; minDelta: number };
    jump: { medianMultiplier: number; minAbsolute: number; highMultiplier: number; medMultiplier: number };
    stutter: { velocityRatio: number; maxFrames: number; minVelocity: number };
    stuck: { minStillFrames: number; maxDelta: number; minSurroundingVelocity: number; highDuration: number; medDuration: number };
    outlier: { ratioThreshold: number };
    lag: { minDelay: number; highDelay: number; medDelay: number };
  };
}

export interface DejitterFinding {
  type: 'jitter' | 'flicker' | 'shiver' | 'jump' | 'stutter' | 'stuck' | 'outlier' | 'lag';
  severity: 'high' | 'medium' | 'low' | 'info';
  elem: string;
  elemLabel: { tag: string; cls: string; text: string };
  prop: string;
  description: string;
  [key: string]: any;
}

export interface DejitterSummary {
  duration: number;
  rawFrameCount: number;
  targetOutputFrames: number;
  mutationEvents: number;
  elementsTracked: number;
  propBreakdown: { anomaly: number; sampled: number; dropped: number };
}

export interface DejitterAPI {
  configure(opts?: Partial<DejitterConfig>): DejitterConfig;
  start(): string;
  stop(): string;
  onStop(callback: () => void): void;
  getData(): any;
  summary(json?: boolean): string | DejitterSummary;
  findings(json?: boolean): string | DejitterFinding[];
  getRaw(): { rawFrames: any[]; mutations: any[]; interactions: any[] };
  toJSON(): string;
}

export function createDejitterRecorder(): DejitterAPI {
  const DEFAULT_CONFIG: DejitterConfig = {
    selector: '*',
    props: ['opacity', 'transform'],
    sampleRate: 15,
    maxDuration: 10000,
    minTextLength: 0,
    mutations: false,
    idleTimeout: 2000,
    thresholds: {
      jitter: { minDeviation: 1, maxDuration: 1000, highSeverity: 20, medSeverity: 5 },
      shiver: { minReversals: 5, minDensity: 0.3, highDensity: 0.7, medDensity: 0.5, minDelta: 0.01 },
      jump: { medianMultiplier: 10, minAbsolute: 50, highMultiplier: 50, medMultiplier: 20 },
      stutter: { velocityRatio: 0.3, maxFrames: 3, minVelocity: 0.5 },
      stuck: { minStillFrames: 3, maxDelta: 0.5, minSurroundingVelocity: 1, highDuration: 500, medDuration: 200 },
      outlier: { ratioThreshold: 3 },
      lag: { minDelay: 50, highDelay: 200, medDelay: 100 },
    },
  };

  let config: DejitterConfig = { ...DEFAULT_CONFIG };
  let recording = false;
  let startTime = 0;
  let rafId: number | null = null;
  let stopTimer: ReturnType<typeof setTimeout> | null = null;
  let mutationObserver: MutationObserver | null = null;
  let interactionAbort: AbortController | null = null;
  let onStopCallbacks: Array<() => void> = [];

  let lastSeen = new Map<string, Record<string, any>>();
  let rawFrames: Array<{ t: number; changes: any[] }> = [];
  let lastChangeTime = 0;
  let hasSeenChange = false;
  let mutations: any[] = [];
  let interactions: Array<{ t: number; type: string }> = [];
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

  function downsample(): any[] {
    if (rawFrames.length === 0) return [];

    const duration = rawFrames[rawFrames.length - 1]!.t;
    const targetFrames = Math.max(1, Math.round((duration / 1000) * config.sampleRate));

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

  function buildPropStats(): { targetFrames: number; props: any[] } {
    const stats: Record<string, any> = {};
    const duration = rawFrames.length ? rawFrames[rawFrames.length - 1]!.t : 0;
    const targetFrames = Math.max(1, Math.round((duration / 1000) * config.sampleRate));

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

  function getTimeline(eId: string, prop: string): Array<{ t: number; value: any }> {
    const timeline: Array<{ t: number; value: any }> = [];
    for (const frame of rawFrames) {
      for (const c of frame.changes) {
        if (c.id === eId && c[prop] !== undefined) {
          timeline.push({ t: frame.t, value: c[prop] });
        }
      }
    }
    return timeline;
  }

  function extractNumeric(value: any): number | null {
    if (value === 'none' || value === '' || value === 'auto') return 0;
    const matrixMatch = String(value).match(/^matrix\(([^)]+)\)$/);
    if (matrixMatch) {
      const parts = matrixMatch[1]!.split(',').map(Number);
      const tx = parts[4] || 0;
      const ty = parts[5] || 0;
      return Math.abs(tx) > Math.abs(ty) ? tx : ty;
    }
    const num = parseFloat(value);
    return isNaN(num) ? null : num;
  }

  function detectBounce(timeline: Array<{ t: number; value: any }>): any | null {
    if (timeline.length < 3) return null;

    const first = timeline[0]!.value;
    const last = timeline[timeline.length - 1]!.value;
    if (first !== last) return null;

    const firstNum = extractNumeric(first);
    if (firstNum === null) return null;

    let peakDeviation = 0;
    let peakT = 0;
    let peakValue = first;
    for (const { t, value } of timeline) {
      const num = extractNumeric(value);
      if (num === null) continue;
      const deviation = Math.abs(num - firstNum);
      if (deviation > peakDeviation) {
        peakDeviation = deviation;
        peakT = t;
        peakValue = value;
      }
    }

    if (peakDeviation === 0) return null;

    return {
      restValue: first,
      peak: peakValue,
      peakDeviation: Math.round(peakDeviation * 10) / 10,
      peakT,
      startT: timeline[0]!.t,
      endT: timeline[timeline.length - 1]!.t,
      duration: timeline[timeline.length - 1]!.t - timeline[0]!.t,
    };
  }

  function detectOutliers(propStats: { targetFrames: number; props: any[] }): any[] {
    const byElem: Record<string, any[]> = {};
    for (const p of propStats.props) {
      if (!byElem[p.elem]) byElem[p.elem] = [];
      byElem[p.elem]!.push(p);
    }

    const outliers: any[] = [];
    for (const [, props] of Object.entries(byElem)) {
      if (props.length < 2) continue;

      const counts = props.map((p: any) => p.raw).sort((a: number, b: number) => a - b);
      const median = counts[Math.floor(counts.length / 2)];

      for (const p of props) {
        if (p.raw <= 1) continue;
        const ratio = median > 0 ? p.raw / median : p.raw;
        const rt = config.thresholds.outlier.ratioThreshold;
        const isOutlier =
          (ratio > rt || ratio < 1 / rt) &&
          p.raw !== counts[counts.length - 1] &&
          p.raw !== counts[0];
        if (isOutlier) {
          outliers.push({ ...p, median, ratio: Math.round(ratio * 10) / 10 });
        }
      }
    }
    return outliers;
  }

  function makeFinding(type: string, severity: string, elem: string, elemLabel: any, prop: string, description: string, extra?: any): DejitterFinding {
    return { type, severity, elem, elemLabel, prop, description, ...extra } as DejitterFinding;
  }

  function countReversals(numeric: Array<{ t: number; val: number }>): number {
    let reversals = 0;
    for (let i = 2; i < numeric.length; i++) {
      const d1 = numeric[i - 1]!.val - numeric[i - 2]!.val;
      const d2 = numeric[i]!.val - numeric[i - 1]!.val;
      if (Math.abs(d1) > config.thresholds.shiver.minDelta && Math.abs(d2) > config.thresholds.shiver.minDelta && d1 * d2 < 0) {
        reversals++;
      }
    }
    return reversals;
  }

  function detectOutlierFindings(propStats: any, elements: any): DejitterFinding[] {
    const findings: DejitterFinding[] = [];
    const outliers = detectOutliers(propStats);

    for (const outlier of outliers) {
      const timeline = getTimeline(outlier.elem, outlier.prop);
      const bounce = detectBounce(timeline);
      const label = elements[outlier.elem];

      if (bounce) {
        const jt = config.thresholds.jitter;
        findings.push(makeFinding(
          'jitter',
          bounce.peakDeviation > jt.highSeverity ? 'high' : bounce.peakDeviation > jt.medSeverity ? 'medium' : 'low',
          outlier.elem, label, outlier.prop,
          `${outlier.prop} bounces from ${bounce.restValue} to ${bounce.peak} and back over ${bounce.duration}ms at t=${bounce.startT}ms`,
          { rawChanges: outlier.raw, medianForElement: outlier.median, bounce, timeline }
        ));
      } else {
        findings.push(makeFinding(
          'outlier', 'info', outlier.elem, label, outlier.prop,
          `${outlier.prop} changed ${outlier.raw}x while sibling props median is ${outlier.median}x`,
          { rawChanges: outlier.raw, medianForElement: outlier.median, timeline }
        ));
      }
    }

    for (const p of propStats.props) {
      if (p.raw < 3) continue;
      if (findings.some((f) => f.elem === p.elem && f.prop === p.prop)) continue;

      const timeline = getTimeline(p.elem, p.prop);
      const bounce = detectBounce(timeline);
      const jt = config.thresholds.jitter;
      if (bounce && bounce.peakDeviation > jt.minDeviation && bounce.duration < jt.maxDuration) {
        const isFlicker = p.prop === 'opacity';
        findings.push(makeFinding(
          isFlicker ? 'flicker' : 'jitter',
          bounce.peakDeviation > jt.highSeverity ? 'high' : bounce.peakDeviation > jt.medSeverity ? 'medium' : 'low',
          p.elem, elements[p.elem], p.prop,
          `${p.prop} bounces from ${bounce.restValue} to ${bounce.peak} and back over ${bounce.duration}ms at t=${bounce.startT}ms`,
          { rawChanges: p.raw, bounce, timeline }
        ));
      }
    }

    return findings;
  }

  function detectShiverFindings(propStats: any, elements: any): DejitterFinding[] {
    const findings: DejitterFinding[] = [];

    for (const p of propStats.props) {
      if (p.raw < 10) continue;

      const timeline = getTimeline(p.elem, p.prop);
      if (timeline.length < 10) continue;

      const numeric: Array<{ t: number; val: number }> = [];
      for (const { t, value } of timeline) {
        const n = extractNumeric(value);
        if (n !== null) numeric.push({ t, val: n });
      }
      if (numeric.length < 10) continue;

      const reversals = countReversals(numeric);
      const reversalDensity = reversals / (numeric.length - 2);

      const st = config.thresholds.shiver;
      if (reversalDensity > st.minDensity && reversals >= st.minReversals) {
        const uniqueVals = [...new Set(numeric.map((n) => Math.round(n.val * 10) / 10))];
        const isTwoValueFight = uniqueVals.length <= 4;

        const vals = numeric.map((n) => n.val);
        const amplitude = Math.round((Math.max(...vals) - Math.min(...vals)) * 10) / 10;
        const hz = Math.round((reversals / ((numeric[numeric.length - 1]!.t - numeric[0]!.t) / 1000)) * 10) / 10;

        findings.push(makeFinding(
          'shiver',
          reversalDensity > st.highDensity ? 'high' : reversalDensity > st.medDensity ? 'medium' : 'low',
          p.elem, elements[p.elem], p.prop,
          isTwoValueFight
            ? `${p.prop} oscillates between ${Math.min(...vals)} and ${Math.max(...vals)} at ${hz}Hz — two forces fighting (${Math.round(reversalDensity * 100)}% frames reverse)`
            : `${p.prop} shivers with ${reversals} direction reversals across ${numeric.length} frames (${Math.round(reversalDensity * 100)}% reversal rate, amplitude ${amplitude}, ${hz}Hz)`,
          {
            rawChanges: p.raw,
            shiver: {
              reversals,
              totalFrames: numeric.length,
              reversalDensity: Math.round(reversalDensity * 1000) / 1000,
              amplitude,
              hz,
              range: [Math.min(...vals), Math.max(...vals)],
              uniqueValues: uniqueVals.length,
              isTwoValueFight,
              durationMs: Math.round(numeric[numeric.length - 1]!.t - numeric[0]!.t),
            },
          }
        ));
      }
    }

    return findings;
  }

  function detectJumpFindings(propStats: any, elements: any): DejitterFinding[] {
    const findings: DejitterFinding[] = [];

    for (const p of propStats.props) {
      if (p.raw < 3) continue;

      const timeline = getTimeline(p.elem, p.prop);
      if (timeline.length < 3) continue;

      const deltas: Array<{ t: number; delta: number; from: any; to: any }> = [];
      for (let i = 1; i < timeline.length; i++) {
        const prev = extractNumeric(timeline[i - 1]!.value);
        const curr = extractNumeric(timeline[i]!.value);
        if (prev === null || curr === null) continue;
        deltas.push({
          t: timeline[i]!.t,
          delta: Math.abs(curr - prev),
          from: timeline[i - 1]!.value,
          to: timeline[i]!.value,
        });
      }

      if (deltas.length < 3) continue;

      const sortedDeltas = deltas.map((d) => d.delta).sort((a, b) => a - b);
      const medianDelta = sortedDeltas[Math.floor(sortedDeltas.length / 2)]!;
      if (medianDelta === 0) continue;

      const jmpT = config.thresholds.jump;
      for (const d of deltas) {
        if (d.delta > medianDelta * jmpT.medianMultiplier && d.delta > jmpT.minAbsolute) {
          findings.push(makeFinding(
            'jump',
            d.delta > medianDelta * jmpT.highMultiplier ? 'high' : d.delta > medianDelta * jmpT.medMultiplier ? 'medium' : 'low',
            p.elem, elements[p.elem], p.prop,
            `${p.prop} jumps from ${d.from} to ${d.to} at t=${d.t}ms (${Math.round(d.delta)}px, typical step is ${Math.round(medianDelta * 10) / 10}px)`,
            {
              rawChanges: p.raw,
              jump: {
                t: d.t,
                from: d.from,
                to: d.to,
                magnitude: Math.round(d.delta),
                medianDelta: Math.round(medianDelta * 10) / 10,
                ratio: Math.round(d.delta / medianDelta),
              },
            }
          ));
        }
      }
    }

    return findings;
  }

  function detectStutterFindings(propStats: any, elements: any): DejitterFinding[] {
    const findings: DejitterFinding[] = [];
    const st = config.thresholds.stutter;

    for (const p of propStats.props) {
      if (p.raw < 6) continue;

      const timeline = getTimeline(p.elem, p.prop);
      if (timeline.length < 6) continue;

      const numeric: Array<{ t: number; val: number }> = [];
      for (const { t, value } of timeline) {
        const n = extractNumeric(value);
        if (n !== null) numeric.push({ t, val: n });
      }
      if (numeric.length < 6) continue;

      const deltas: number[] = [];
      for (let i = 1; i < numeric.length; i++) {
        deltas.push(numeric[i]!.val - numeric[i - 1]!.val);
      }

      const windowSize = 5;
      let i = 0;
      while (i < deltas.length) {
        const winStart = Math.max(0, i - windowSize);
        if (i - winStart < 2) { i++; continue; }

        let sum = 0;
        for (let w = winStart; w < i; w++) sum += deltas[w]!;
        const dominantDir = Math.sign(sum);
        if (dominantDir === 0) { i++; continue; }

        if (deltas[i]! !== 0 && Math.sign(deltas[i]!) !== dominantDir) {
          const reversalStart = i;
          let reversalEnd = i;
          while (
            reversalEnd + 1 < deltas.length &&
            reversalEnd - reversalStart + 1 < st.maxFrames &&
            deltas[reversalEnd + 1]! !== 0 &&
            Math.sign(deltas[reversalEnd + 1]!) !== dominantDir
          ) {
            reversalEnd++;
          }

          const afterIdx = reversalEnd + 1;
          if (afterIdx >= deltas.length || Math.sign(deltas[afterIdx]!) !== dominantDir) {
            i = reversalEnd + 1;
            continue;
          }

          let reversalMag = 0;
          for (let r = reversalStart; r <= reversalEnd; r++) {
            reversalMag += Math.abs(deltas[r]!);
          }

          const localStart = Math.max(0, reversalStart - windowSize);
          const localEnd = Math.min(deltas.length - 1, reversalEnd + windowSize);
          let localSum = 0;
          let localCount = 0;
          for (let l = localStart; l <= localEnd; l++) {
            if (l >= reversalStart && l <= reversalEnd) continue;
            localSum += Math.abs(deltas[l]!);
            localCount++;
          }
          const localVelocity = localCount > 0 ? localSum / localCount : 0;

          if (localVelocity >= st.minVelocity) {
            const ratio = reversalMag / localVelocity;
            if (ratio >= st.velocityRatio) {
              const reversalFrameCount = reversalEnd - reversalStart + 1;
              const severity = ratio >= 1.0 ? 'high' : ratio >= 0.5 ? 'medium' : 'low';
              const t = numeric[reversalStart + 1]!.t;
              findings.push(makeFinding(
                'stutter', severity,
                p.elem, elements[p.elem], p.prop,
                `${p.prop} reverses for ${reversalFrameCount} frame${reversalFrameCount > 1 ? 's' : ''} at t=${t}ms during smooth motion (reversal ${Math.round(reversalMag * 10) / 10}px vs local velocity ${Math.round(localVelocity * 10) / 10}px/frame, ratio ${Math.round(ratio * 100) / 100})`,
                {
                  rawChanges: p.raw,
                  stutter: {
                    t,
                    reversalFrames: reversalFrameCount,
                    reversalMagnitude: Math.round(reversalMag * 10) / 10,
                    localVelocity: Math.round(localVelocity * 10) / 10,
                    ratio: Math.round(ratio * 100) / 100,
                    dominantDirection: dominantDir > 0 ? 'increasing' : 'decreasing',
                  },
                }
              ));
            }
          }

          i = reversalEnd + 1;
        } else {
          i++;
        }
      }
    }

    return findings;
  }

  function detectStuckFindings(propStats: any, elements: any): DejitterFinding[] {
    const findings: DejitterFinding[] = [];
    const sk = config.thresholds.stuck;

    for (const p of propStats.props) {
      if (p.raw < 6) continue;

      const timeline = getTimeline(p.elem, p.prop);
      if (timeline.length < 6) continue;

      const numeric: Array<{ t: number; val: number }> = [];
      for (const { t, value } of timeline) {
        const n = extractNumeric(value);
        if (n !== null) numeric.push({ t, val: n });
      }
      if (numeric.length < 6) continue;

      const deltas: number[] = [];
      for (let i = 1; i < numeric.length; i++) {
        deltas.push(Math.abs(numeric[i]!.val - numeric[i - 1]!.val));
      }

      let i = 0;
      while (i < deltas.length) {
        if (deltas[i]! > sk.maxDelta) { i++; continue; }

        const runStart = i;
        while (i < deltas.length && deltas[i]! <= sk.maxDelta) i++;
        const runEnd = i - 1;
        const stillCount = runEnd - runStart + 1;

        if (stillCount < sk.minStillFrames) continue;

        const windowSize = 5;
        let surroundingSum = 0;
        let surroundingCount = 0;

        const beforeStart = Math.max(0, runStart - windowSize);
        for (let b = beforeStart; b < runStart; b++) {
          surroundingSum += deltas[b]!;
          surroundingCount++;
        }

        const afterEnd = Math.min(deltas.length - 1, runEnd + windowSize);
        for (let a = runEnd + 1; a <= afterEnd; a++) {
          surroundingSum += deltas[a]!;
          surroundingCount++;
        }

        if (surroundingCount === 0) continue;
        const meanSurroundingVelocity = surroundingSum / surroundingCount;

        if (meanSurroundingVelocity < sk.minSurroundingVelocity) continue;

        const tStart = numeric[runStart]!.t;
        const tEnd = numeric[runEnd + 1]!.t;
        const duration = Math.round(tEnd - tStart);

        const severity = duration >= sk.highDuration ? 'high' : duration >= sk.medDuration ? 'medium' : 'low';

        findings.push(makeFinding(
          'stuck', severity,
          p.elem, elements[p.elem], p.prop,
          `${p.prop} stalls for ${stillCount} frames (${duration}ms) at t=${Math.round(tStart)}ms while surrounding motion averages ${Math.round(meanSurroundingVelocity * 10) / 10}px/frame`,
          {
            rawChanges: p.raw,
            stuck: {
              t: Math.round(tStart),
              duration,
              stillFrames: stillCount,
              meanSurroundingVelocity: Math.round(meanSurroundingVelocity * 10) / 10,
              stuckValue: numeric[runStart]!.val,
            },
          }
        ));
      }
    }

    return findings;
  }

  function detectLagFindings(elements: Record<string, any>): DejitterFinding[] {
    const findings: DejitterFinding[] = [];
    if (interactions.length === 0 || rawFrames.length === 0) return findings;

    const lt = config.thresholds.lag;

    for (const interaction of interactions) {
      let firstFrame: { t: number; changes: any[] } | null = null;
      for (const frame of rawFrames) {
        if (frame.t > interaction.t) {
          firstFrame = frame;
          break;
        }
      }

      if (!firstFrame) continue;

      const delay = firstFrame.t - interaction.t;
      if (delay < lt.minDelay) continue;

      const severity = delay >= lt.highDelay ? 'high' : delay >= lt.medDelay ? 'medium' : 'low';

      const firstChange = firstFrame.changes[0];
      const label = (firstChange && elements[firstChange.id]) || { tag: '?', cls: '', text: '' };

      findings.push(makeFinding(
        'lag', severity,
        firstChange?.id || '?', label, interaction.type,
        `${delay}ms between ${interaction.type} at t=${interaction.t}ms and first visual change at t=${firstFrame.t}ms`,
        {
          lag: {
            interactionType: interaction.type,
            interactionT: interaction.t,
            firstChangeT: firstFrame.t,
            delay,
          },
        }
      ));
    }

    return findings;
  }

  function deduplicateShivers(findings: DejitterFinding[]): DejitterFinding[] {
    const shiverFindings = findings.filter((f) => f.type === 'shiver');
    const otherFindings = findings.filter((f) => f.type !== 'shiver');

    const shiverGroups = new Map<string, DejitterFinding[]>();
    for (const f of shiverFindings) {
      const key = `${f.prop}|${f.shiver.hz}|${f.shiver.isTwoValueFight}`;
      if (!shiverGroups.has(key)) shiverGroups.set(key, []);
      shiverGroups.get(key)!.push(f);
    }

    const deduped: DejitterFinding[] = [];
    for (const group of shiverGroups.values()) {
      if (group.length === 1) {
        deduped.push(group[0]!);
      } else {
        group.sort((a, b) => b.shiver.amplitude - a.shiver.amplitude);
        const rep = { ...group[0]! };
        (rep as any).affectedElements = group.length;
        rep.description += ` (affects ${group.length} elements)`;
        deduped.push(rep);
      }
    }

    return [...otherFindings, ...deduped];
  }

  function analyzeFindings(): DejitterFinding[] {
    const propStats = buildPropStats();
    const elements = buildElementMap();

    let findings = detectOutlierFindings(propStats, elements);
    findings = findings.concat(detectShiverFindings(propStats, elements));
    findings = findings.concat(detectJumpFindings(propStats, elements));
    findings = findings.concat(detectStutterFindings(propStats, elements));
    findings = findings.concat(detectStuckFindings(propStats, elements));
    findings = findings.concat(detectLagFindings(elements));
    findings = deduplicateShivers(findings);

    const sevOrder: Record<string, number> = { high: 0, medium: 1, low: 2, info: 3 };
    findings.sort((a, b) => sevOrder[a.severity]! - sevOrder[b.severity]!);

    return findings;
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
        byMode[p.mode] = (byMode[p.mode] || 0) + 1;
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
      const data = analyzeFindings().map(({ timeline, ...rest }) => rest) as DejitterFinding[];
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
