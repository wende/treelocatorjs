/**
 * Dejitter anomaly detectors.
 *
 * Each detector is a pure function of an AnalysisContext (recorded frames,
 * per-prop change stats, thresholds) and the findings produced by earlier
 * detectors — each element+prop pair is only reported by the first detector
 * that matches it.
 */

import type {
  AnalysisContext,
  DejitterFinding,
  NumericPoint,
  PropStat,
} from "./types";
import { countReversals, detectBounce, extractNumeric, toNumericTimeline } from "./numeric";

function makeFinding(type: string, severity: string, elem: string, elemLabel: any, prop: string, description: string, extra?: any): DejitterFinding {
  return { type, severity, elem, elemLabel, prop, description, ...extra } as DejitterFinding;
}

/**
 * Yield prop stats worth analyzing: enough raw changes, and not already
 * claimed by an earlier detector.
 */
function* analyzableProps(
  ctx: AnalysisContext,
  existingFindings: DejitterFinding[],
  minRaw: number
): Generator<PropStat> {
  for (const p of ctx.propStats.props) {
    if (p.raw < minRaw) continue;
    if (existingFindings.some((f) => f.elem === p.elem && f.prop === p.prop)) {
      continue;
    }
    yield p;
  }
}

function detectOutliers(ctx: AnalysisContext): any[] {
  const byElem: Record<string, PropStat[]> = {};
  for (const p of ctx.propStats.props) {
    if (!byElem[p.elem]) byElem[p.elem] = [];
    byElem[p.elem]!.push(p);
  }

  const outliers: any[] = [];
  for (const [, props] of Object.entries(byElem)) {
    if (props.length < 2) continue;

    const counts = props.map((p) => p.raw).sort((a, b) => a - b);
    const median = counts[Math.floor(counts.length / 2)];

    for (const p of props) {
      if (p.raw <= 1) continue;
      const ratio = median! > 0 ? p.raw / median! : p.raw;
      const rt = ctx.thresholds.outlier.ratioThreshold;
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

export function detectOutlierFindings(ctx: AnalysisContext): DejitterFinding[] {
  const findings: DejitterFinding[] = [];
  const outliers = detectOutliers(ctx);
  const jt = ctx.thresholds.jitter;

  for (const outlier of outliers) {
    const timeline = ctx.getTimeline(outlier.elem, outlier.prop);
    const bounce = detectBounce(timeline);
    const label = ctx.elements[outlier.elem];

    if (bounce) {
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

  for (const p of analyzableProps(ctx, findings, 3)) {
    const timeline = ctx.getTimeline(p.elem, p.prop);
    const bounce = detectBounce(timeline);
    if (bounce && bounce.peakDeviation > jt.minDeviation && bounce.duration < jt.maxDuration) {
      const isFlicker = p.prop === 'opacity';
      findings.push(makeFinding(
        isFlicker ? 'flicker' : 'jitter',
        bounce.peakDeviation > jt.highSeverity ? 'high' : bounce.peakDeviation > jt.medSeverity ? 'medium' : 'low',
        p.elem, ctx.elements[p.elem], p.prop,
        `${p.prop} bounces from ${bounce.restValue} to ${bounce.peak} and back over ${bounce.duration}ms at t=${bounce.startT}ms`,
        { rawChanges: p.raw, bounce, timeline }
      ));
    }
  }

  return findings;
}

export function detectShiverFindings(ctx: AnalysisContext, existingFindings: DejitterFinding[]): DejitterFinding[] {
  const findings: DejitterFinding[] = [];
  const st = ctx.thresholds.shiver;

  for (const p of analyzableProps(ctx, existingFindings, 10)) {
    const timeline = ctx.getTimeline(p.elem, p.prop);
    if (timeline.length < 10) continue;

    const numeric = toNumericTimeline(timeline);
    if (numeric.length < 10) continue;

    const reversals = countReversals(numeric, st.minDelta);
    const reversalDensity = reversals / (numeric.length - 2);

    if (reversalDensity > st.minDensity && reversals >= st.minReversals) {
      const uniqueVals = [...new Set(numeric.map((n) => Math.round(n.val * 10) / 10))];
      const isTwoValueFight = uniqueVals.length <= 4;

      const vals = numeric.map((n) => n.val);
      const amplitude = Math.round((Math.max(...vals) - Math.min(...vals)) * 10) / 10;
      const hz = Math.round((reversals / ((numeric[numeric.length - 1]!.t - numeric[0]!.t) / 1000)) * 10) / 10;

      findings.push(makeFinding(
        'shiver',
        reversalDensity > st.highDensity ? 'high' : reversalDensity > st.medDensity ? 'medium' : 'low',
        p.elem, ctx.elements[p.elem], p.prop,
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

export function detectJumpFindings(ctx: AnalysisContext, existingFindings: DejitterFinding[]): DejitterFinding[] {
  const findings: DejitterFinding[] = [];
  const jmpT = ctx.thresholds.jump;

  for (const p of analyzableProps(ctx, existingFindings, 3)) {
    const timeline = ctx.getTimeline(p.elem, p.prop);
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

    for (const d of deltas) {
      if (d.delta > medianDelta * jmpT.medianMultiplier && d.delta > jmpT.minAbsolute) {
        findings.push(makeFinding(
          'jump',
          d.delta > medianDelta * jmpT.highMultiplier ? 'high' : d.delta > medianDelta * jmpT.medMultiplier ? 'medium' : 'low',
          p.elem, ctx.elements[p.elem], p.prop,
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

export function detectStutterFindings(ctx: AnalysisContext, existingFindings: DejitterFinding[]): DejitterFinding[] {
  const findings: DejitterFinding[] = [];
  const st = ctx.thresholds.stutter;

  for (const p of analyzableProps(ctx, existingFindings, 6)) {
    const timeline = ctx.getTimeline(p.elem, p.prop);
    if (timeline.length < 6) continue;

    const numeric = toNumericTimeline(timeline);
    if (numeric.length < 6) continue;

    // Split the timeline into temporally-contiguous segments. A gap larger
    // than maxFrameGap (ms) means the previous animation ended and a new
    // one started — a direction change across that gap is two separate
    // motions, not a mid-motion stutter.
    const segments: NumericPoint[][] = [];
    let segStart = 0;
    for (let k = 1; k < numeric.length; k++) {
      if (numeric[k]!.t - numeric[k - 1]!.t > st.maxFrameGap) {
        segments.push(numeric.slice(segStart, k));
        segStart = k;
      }
    }
    segments.push(numeric.slice(segStart));

    for (const segment of segments) {
      if (segment.length < 6) continue;

      const deltas: number[] = [];
      for (let k = 1; k < segment.length; k++) {
        deltas.push(segment[k]!.val - segment[k - 1]!.val);
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
              const t = segment[reversalStart + 1]!.t;
              findings.push(makeFinding(
                'stutter', severity,
                p.elem, ctx.elements[p.elem], p.prop,
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
  }

  return findings;
}

export function detectStuckFindings(ctx: AnalysisContext, existingFindings: DejitterFinding[]): DejitterFinding[] {
  const findings: DejitterFinding[] = [];
  const sk = ctx.thresholds.stuck;

  for (const p of analyzableProps(ctx, existingFindings, 6)) {
    const timeline = ctx.getTimeline(p.elem, p.prop);
    if (timeline.length < 6) continue;

    const numeric = toNumericTimeline(timeline);
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
        p.elem, ctx.elements[p.elem], p.prop,
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

export function detectLagFindings(ctx: AnalysisContext): DejitterFinding[] {
  const findings: DejitterFinding[] = [];
  if (ctx.interactions.length === 0 || ctx.rawFrames.length === 0) return findings;

  const lt = ctx.thresholds.lag;

  for (const interaction of ctx.interactions) {
    let firstFrame: { t: number; changes: any[] } | null = null;
    for (const frame of ctx.rawFrames) {
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
    const label = (firstChange && ctx.elements[firstChange.id]) || { tag: '?', cls: '', text: '' };

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

/**
 * Collapse identical shivers reported on multiple elements (same prop,
 * frequency, and shape) into one representative finding.
 */
export function deduplicateShivers(findings: DejitterFinding[]): DejitterFinding[] {
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

const SEVERITY_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2, info: 3 };

/** Run all detectors and return findings sorted by severity. */
export function analyzeFindings(ctx: AnalysisContext): DejitterFinding[] {
  let findings = detectOutlierFindings(ctx);
  findings = findings.concat(detectShiverFindings(ctx, findings));
  findings = findings.concat(detectJumpFindings(ctx, findings));
  findings = findings.concat(detectStutterFindings(ctx, findings));
  findings = findings.concat(detectStuckFindings(ctx, findings));
  findings = findings.concat(detectLagFindings(ctx));
  findings = deduplicateShivers(findings);

  findings.sort((a, b) => SEVERITY_ORDER[a.severity]! - SEVERITY_ORDER[b.severity]!);

  return findings;
}
