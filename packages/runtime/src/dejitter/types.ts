/**
 * Shared types for the Dejitter recorder and its anomaly detectors.
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
    stutter: { velocityRatio: number; maxFrames: number; minVelocity: number; maxFrameGap: number };
    stuck: { minStillFrames: number; maxDelta: number; minSurroundingVelocity: number; highDuration: number; medDuration: number };
    outlier: { ratioThreshold: number };
    lag: { minDelay: number; highDelay: number; medDelay: number };
  };
}

export type DejitterThresholds = DejitterConfig["thresholds"];

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

/** One recorded animation frame: timestamp + per-element property deltas. */
export interface RawFrame {
  t: number;
  changes: any[];
}

/** One observed value of a single element property over time. */
export interface TimelinePoint {
  t: number;
  value: any;
}

/** TimelinePoint with the value coerced to a number (see extractNumeric). */
export interface NumericPoint {
  t: number;
  val: number;
}

/** Per element+property change statistics computed after recording. */
export interface PropStat {
  elem: string;
  prop: string;
  raw: number;
  mode?: 'anomaly' | 'sampled' | 'dropped';
  output?: number;
  [key: string]: any;
}

export interface PropStats {
  targetFrames: number;
  props: PropStat[];
}

export type ElementLabels = Record<string, any>;

export interface InteractionRecord {
  t: number;
  type: string;
}

/**
 * Everything the anomaly detectors need to analyze a finished recording,
 * decoupled from the recorder's internal mutable state.
 */
export interface AnalysisContext {
  thresholds: DejitterThresholds;
  propStats: PropStats;
  elements: ElementLabels;
  interactions: InteractionRecord[];
  rawFrames: RawFrame[];
  getTimeline(elemId: string, prop: string): TimelinePoint[];
}

export const DEFAULT_CONFIG: DejitterConfig = {
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
    stutter: { velocityRatio: 0.3, maxFrames: 3, minVelocity: 0.5, maxFrameGap: 100 },
    stuck: { minStillFrames: 3, maxDelta: 0.5, minSurroundingVelocity: 1, highDuration: 500, medDuration: 200 },
    outlier: { ratioThreshold: 3 },
    lag: { minDelay: 50, highDelay: 200, medDelay: 100 },
  },
};
