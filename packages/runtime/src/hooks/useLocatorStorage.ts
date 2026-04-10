import type { DejitterFinding, DejitterSummary } from "../dejitter/recorder";
import type { InteractionEvent } from "../components/RecordingResults";
import type { DeltaReport } from "../visualDiff/types";

export const STORAGE_KEY = "__treelocator_recording__";

export type SavedRecording = {
  findings: DejitterFinding[];
  summary: DejitterSummary | null;
  data: any;
  elementPath: string;
  interactions: InteractionEvent[];
  visualDiff?: DeltaReport | null;
};

export function loadFromStorage(): {
  last: SavedRecording | null;
  previous: SavedRecording | null;
} {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // Ignore localStorage errors (SSR, permissions, quota)
  }
  return { last: null, previous: null };
}

export function saveToStorage(current: SavedRecording): void {
  try {
    const stored = loadFromStorage();
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        last: current,
        previous: stored.last,
      })
    );
  } catch {
    // Ignore localStorage errors (SSR, permissions, quota)
  }
}

export function clearStorage(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore localStorage errors (SSR, permissions, quota)
  }
}
