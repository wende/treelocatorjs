import type { DejitterFinding, DejitterSummary } from "../dejitter/recorder";
import type { InteractionEvent } from "../components/RecordingResults";
import type { DeltaReport } from "../visualDiff/types";
import { getStorage } from "./getStorage";

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
  const storage = getStorage();
  if (!storage) return { last: null, previous: null };

  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // Ignore localStorage errors (SSR, permissions, quota)
  }
  return { last: null, previous: null };
}

export function saveToStorage(current: SavedRecording): void {
  const storage = getStorage();
  if (!storage) return;

  try {
    const stored = loadFromStorage();
    storage.setItem(
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
  const storage = getStorage();
  if (!storage) return;

  try {
    storage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore localStorage errors (SSR, permissions, quota)
  }
}
