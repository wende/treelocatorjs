import { For } from "solid-js";
import {
  DEFAULT_SETTINGS,
  resetSettings,
  setSetting,
  settings,
  type TreelocatorSettings,
} from "../hooks/useSettings";

type SettingsPanelProps = {
  onDismiss: () => void;
};

type ToggleKey =
  | "anomalyTracking"
  | "visualDiff"
  | "computedStyles"
  | "computedStylesIncludeDefaults";
type NumberKey = "sampleRate" | "maxDurationMs" | "jumpMinAbsolute" | "lagMinDelay";

const TOGGLES: { key: ToggleKey; label: string; hint: string }[] = [
  {
    key: "anomalyTracking",
    label: "Anomaly tracking",
    hint: "Detect jitter, jumps, stutter, stuck frames",
  },
  {
    key: "visualDiff",
    label: "Visual diff",
    hint: "Snapshot before/after element tree",
  },
  {
    key: "computedStyles",
    label: "Computed styles",
    hint: "Include styles in alt+click clipboard output",
  },
  {
    key: "computedStylesIncludeDefaults",
    label: "Include default styles",
    hint: "Show browser-default values like display:block and font-weight:bold",
  },
];

const NUMBERS: {
  key: NumberKey;
  label: string;
  hint: string;
  unit: string;
  min: number;
  max: number;
  step: number;
}[] = [
  {
    key: "sampleRate",
    label: "Sample rate",
    hint: "Max frames per second to capture",
    unit: "Hz",
    min: 1,
    max: 60,
    step: 1,
  },
  {
    key: "maxDurationMs",
    label: "Max duration",
    hint: "Auto-stop recording after this long",
    unit: "ms",
    min: 1000,
    max: 120000,
    step: 1000,
  },
  {
    key: "jumpMinAbsolute",
    label: "Jump threshold",
    hint: "Minimum px delta to flag a jump",
    unit: "px",
    min: 1,
    max: 1000,
    step: 1,
  },
  {
    key: "lagMinDelay",
    label: "Lag threshold",
    hint: "Minimum rAF delay to flag lag",
    unit: "ms",
    min: 1,
    max: 1000,
    step: 1,
  },
];

const rowStyle = {
  display: "flex",
  "align-items": "center",
  "justify-content": "space-between",
  gap: "12px",
  padding: "8px 0",
  "border-bottom": "1px solid rgba(255, 255, 255, 0.05)",
};

const labelStyle = { "min-width": "0", flex: "1 1 auto" };
const labelTitle = { "font-weight": "600", color: "#fff" };
const labelHint = {
  color: "#9ca3af",
  "font-size": "11px",
  "margin-top": "2px",
  "line-height": "1.3",
};

const sectionTitleStyle = {
  "margin-bottom": "4px",
  color: "#9ca3af",
  "font-size": "11px",
  "text-transform": "uppercase",
  "letter-spacing": "0.5px",
};

function Toggle(props: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div
      role="switch"
      aria-checked={props.checked}
      onClick={() => props.onChange(!props.checked)}
      style={{
        cursor: "pointer",
        width: "32px",
        height: "18px",
        "border-radius": "9px",
        background: props.checked
          ? "rgba(59, 130, 246, 0.6)"
          : "rgba(255, 255, 255, 0.12)",
        position: "relative",
        transition: "background 0.15s",
        "flex-shrink": "0",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "2px",
          left: props.checked ? "16px" : "2px",
          width: "14px",
          height: "14px",
          "border-radius": "50%",
          background: "#fff",
          transition: "left 0.15s",
        }}
      />
    </div>
  );
}

function NumberInput(props: {
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (v: number) => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        "align-items": "center",
        gap: "4px",
        "flex-shrink": "0",
      }}
    >
      <input
        type="number"
        value={props.value}
        min={props.min}
        max={props.max}
        step={props.step}
        onInput={(e) => {
          const n = Number(e.currentTarget.value);
          if (!Number.isFinite(n)) return;
          const clamped = Math.min(props.max, Math.max(props.min, n));
          props.onChange(clamped);
        }}
        style={{
          width: "72px",
          padding: "4px 6px",
          "border-radius": "4px",
          background: "rgba(255, 255, 255, 0.08)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          color: "#fff",
          "font-family": "inherit",
          "font-size": "11px",
          "text-align": "right",
          outline: "none",
        }}
      />
      <span style={{ color: "#9ca3af", "font-size": "11px", "min-width": "18px" }}>
        {props.unit}
      </span>
    </div>
  );
}

export function SettingsPanel(props: SettingsPanelProps) {
  const current = () => settings();

  return (
    <div
      data-treelocator-settings-panel
      style={{
        position: "fixed",
        bottom: "180px",
        right: "20px",
        "z-index": "2147483646",
        width: "340px",
        "max-height": "400px",
        "overflow-y": "auto",
        background: "rgba(15, 15, 15, 0.92)",
        "backdrop-filter": "blur(12px)",
        "border-radius": "12px",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        "box-shadow": "0 8px 32px rgba(0, 0, 0, 0.4)",
        color: "#e5e5e5",
        "font-family": "system-ui, -apple-system, sans-serif",
        "font-size": "12px",
        "pointer-events": "auto",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          "align-items": "center",
          "justify-content": "space-between",
          padding: "12px 14px 8px",
          "border-bottom": "1px solid rgba(255, 255, 255, 0.08)",
        }}
      >
        <div>
          <div style={{ "font-weight": "600", "font-size": "13px", color: "#fff" }}>
            Settings
          </div>
          <div style={{ color: "#9ca3af", "margin-top": "2px" }}>
            Persisted to localStorage
          </div>
        </div>
        <div style={{ display: "flex", "align-items": "center", gap: "4px" }}>
          <div
            style={{
              cursor: "pointer",
              padding: "4px 10px",
              "border-radius": "4px",
              background: "rgba(255, 255, 255, 0.08)",
              color: "#9ca3af",
              "font-size": "11px",
              "font-weight": "600",
            }}
            onClick={resetSettings}
          >
            Reset
          </div>
          <div
            style={{
              cursor: "pointer",
              padding: "4px 8px",
              "border-radius": "4px",
              color: "#9ca3af",
              "font-size": "16px",
              "line-height": "1",
            }}
            onClick={props.onDismiss}
          >
            &times;
          </div>
        </div>
      </div>

      {/* Feature toggles */}
      <div style={{ padding: "8px 14px" }}>
        <div style={sectionTitleStyle}>Features</div>
        <For each={TOGGLES}>
          {(item) => (
            <div style={rowStyle}>
              <div style={labelStyle}>
                <div style={labelTitle}>{item.label}</div>
                <div style={labelHint}>{item.hint}</div>
              </div>
              <Toggle
                checked={current()[item.key]}
                onChange={(v) => setSetting(item.key, v)}
              />
            </div>
          )}
        </For>
      </div>

      {/* Thresholds */}
      <div
        style={{
          padding: "8px 14px 12px",
          "border-top": "1px solid rgba(255, 255, 255, 0.08)",
        }}
      >
        <div style={sectionTitleStyle}>Thresholds</div>
        <For each={NUMBERS}>
          {(item) => (
            <div style={rowStyle}>
              <div style={labelStyle}>
                <div style={labelTitle}>{item.label}</div>
                <div style={labelHint}>{item.hint}</div>
              </div>
              <NumberInput
                value={current()[item.key]}
                min={item.min}
                max={item.max}
                step={item.step}
                unit={item.unit}
                onChange={(v) =>
                  setSetting(item.key as keyof TreelocatorSettings, v as never)
                }
              />
            </div>
          )}
        </For>
        <div
          style={{
            color: "#6b7280",
            "font-size": "11px",
            "margin-top": "8px",
          }}
        >
          Defaults: sample {DEFAULT_SETTINGS.sampleRate}Hz, max{" "}
          {DEFAULT_SETTINGS.maxDurationMs}ms, jump {DEFAULT_SETTINGS.jumpMinAbsolute}px,
          lag {DEFAULT_SETTINGS.lagMinDelay}ms
        </div>
      </div>
    </div>
  );
}
