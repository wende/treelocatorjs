export interface ElementSnapshot {
  key: string;
  tagName: string;
  id?: string;
  classes: string[];
  x: number;
  y: number;
  width: number;
  height: number;
  visible: boolean;
  opacity: number;
  inViewport: boolean;
  pointerEvents: string;
  disabled: boolean;
  text?: string;
}

export type DeltaChangeType = "+" | "-" | "~" | "→";

export interface DeltaEntry {
  type: DeltaChangeType;
  key: string;
  label: string;
  before?: ElementSnapshot;
  after?: ElementSnapshot;
  changedFields?: string[];
}

export interface DeltaReport {
  elapsedMs: number;
  settle: "clean" | "timeout";
  counts: {
    added: number;
    removed: number;
    changed: number;
    moved: number;
  };
  entries: DeltaEntry[];
  text: string;
}
