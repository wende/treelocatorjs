import { createRoot, createSignal, type Accessor } from "solid-js";
import { getStorage } from "./getStorage";

export type TreelocatorSettings = {
  anomalyTracking: boolean;
  visualDiff: boolean;
  computedStyles: boolean;
  computedStylesIncludeDefaults: boolean;
  sampleRate: number;
  maxDurationMs: number;
  jumpMinAbsolute: number;
  lagMinDelay: number;
};

export const DEFAULT_SETTINGS: TreelocatorSettings = {
  anomalyTracking: true,
  visualDiff: true,
  computedStyles: true,
  computedStylesIncludeDefaults: false,
  sampleRate: 15,
  maxDurationMs: 30000,
  jumpMinAbsolute: 50,
  lagMinDelay: 50,
};

const STORAGE_KEY = "__treelocator_settings__";

function loadSettings(): TreelocatorSettings {
  const storage = getStorage();
  if (!storage) return { ...DEFAULT_SETTINGS };

  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    // Ignore localStorage errors (SSR, permissions, quota)
  }
  return { ...DEFAULT_SETTINGS };
}

function persistSettings(next: TreelocatorSettings): void {
  const storage = getStorage();
  if (!storage) return;

  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Ignore localStorage errors (SSR, permissions, quota)
  }
}

type SettingsAPI = {
  settings: Accessor<TreelocatorSettings>;
  setSetting: <K extends keyof TreelocatorSettings>(
    key: K,
    value: TreelocatorSettings[K]
  ) => void;
  resetSettings: () => void;
};

export const { settings, setSetting, resetSettings }: SettingsAPI = createRoot(
  () => {
    const [settings, setSettingsSignal] = createSignal<TreelocatorSettings>(
      loadSettings()
    );

    function setSetting<K extends keyof TreelocatorSettings>(
      key: K,
      value: TreelocatorSettings[K]
    ) {
      const next = { ...settings(), [key]: value };
      setSettingsSignal(next);
      persistSettings(next);
    }

    function resetSettings() {
      setSettingsSignal({ ...DEFAULT_SETTINGS });
      persistSettings(DEFAULT_SETTINGS);
    }

    return { settings, setSetting, resetSettings };
  }
);
