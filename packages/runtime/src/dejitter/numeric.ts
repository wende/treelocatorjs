/**
 * Pure numeric helpers shared by the Dejitter anomaly detectors.
 */

import type { NumericPoint, TimelinePoint } from "./types";

/**
 * Coerce an observed CSS value to a comparable number.
 * - "none"/""/"auto" count as 0 (resting state).
 * - matrix(...) transforms yield the dominant translation axis.
 * - Anything unparsable returns null and is skipped by the detectors.
 */
export function extractNumeric(value: any): number | null {
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

/** Convert a timeline to numeric points, dropping unparsable values. */
export function toNumericTimeline(timeline: TimelinePoint[]): NumericPoint[] {
  const numeric: NumericPoint[] = [];
  for (const { t, value } of timeline) {
    const n = extractNumeric(value);
    if (n !== null) numeric.push({ t, val: n });
  }
  return numeric;
}

export interface BounceInfo {
  restValue: any;
  peak: any;
  peakDeviation: number;
  peakT: number;
  startT: number;
  endT: number;
  duration: number;
}

/**
 * Detect an "out and back" motion: the value starts and ends at the same
 * rest value but deviates in between. Returns the peak deviation, or null
 * when the timeline is not a bounce.
 */
export function detectBounce(timeline: TimelinePoint[]): BounceInfo | null {
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

/**
 * Count direction reversals in a numeric timeline, ignoring movements
 * smaller than minDelta (sub-pixel noise).
 */
export function countReversals(numeric: NumericPoint[], minDelta: number): number {
  let reversals = 0;
  for (let i = 2; i < numeric.length; i++) {
    const d1 = numeric[i - 1]!.val - numeric[i - 2]!.val;
    const d2 = numeric[i]!.val - numeric[i - 1]!.val;
    if (Math.abs(d1) > minDelta && Math.abs(d2) > minDelta && d1 * d2 < 0) {
      reversals++;
    }
  }
  return reversals;
}
