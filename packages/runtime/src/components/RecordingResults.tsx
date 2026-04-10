import { For, Show } from "solid-js";
import type { DejitterFinding, DejitterSummary } from "../dejitter/recorder";
import type { DeltaReport } from "../visualDiff/types";

export type InteractionEvent = {
  t: number;
  type: string;
  target: string;
  x: number;
  y: number;
};

type RecordingResultsProps = {
  findings: DejitterFinding[];
  summary: DejitterSummary | null;
  data: any;
  elementPath: string;
  interactions: InteractionEvent[];
  visualDiff?: DeltaReport | null;
  onDismiss: () => void;
  onReplay?: () => void;
  replaying?: boolean;
  onToast?: (msg: string) => void;
  hasPrevious?: boolean;
  onLoadPrevious?: () => void;
  hasNext?: boolean;
  onLoadNext?: () => void;
};

const SEVERITY_COLORS: Record<string, string> = {
  high: "#ef4444",
  medium: "#f59e0b",
  low: "#eab308",
  info: "#9ca3af",
};

function formatDataForClipboard(
  data: any,
  elementPath: string,
  summary: DejitterSummary | null,
  findings: DejitterFinding[],
  interactions: InteractionEvent[],
  visualDiff: DeltaReport | null | undefined
): string {
  const lines: string[] = [];

  // Element ancestry path from treelocator
  if (elementPath) {
    lines.push(`Element: ${elementPath}`);
  }

  // Header
  const frameCount = summary?.rawFrameCount ?? 0;
  lines.push(`Recording: ${Math.round(summary?.duration ?? 0)}ms, ${frameCount} frames`);
  lines.push('');

  // Property changes — only meaningful with >1 frame; a single sample is
  // the initial reading, not a change, and dejitter labels it "anomaly" which
  // is misleading.
  if (frameCount > 1 && data?.propStats?.props && data.propStats.props.length > 0) {
    const realChanges = data.propStats.props.filter(
      (p: { raw: number }) => p.raw > 1
    );
    if (realChanges.length > 0) {
      lines.push('Changed properties:');
      for (const p of realChanges) {
        lines.push(`  ${p.prop}: ${p.raw - 1} changes (${p.mode})`);
      }
      lines.push('');
    }
  }

  // Samples with actual values — skip if we only captured the initial frame.
  if (frameCount > 1 && data?.samples && data.samples.length > 0) {
    lines.push('Timeline:');
    for (const frame of data.samples) {
      for (const change of frame.changes) {
        const { id, ...props } = change;
        const propEntries = Object.entries(props);
        if (propEntries.length > 0) {
          const vals = propEntries.map(([k, v]) => `${k}=${v}`).join(', ');
          lines.push(`  ${frame.t}ms: ${vals}`);
        }
      }
    }
    lines.push('');
  }

  // Findings — replace dejitter element IDs in descriptions
  if (findings.length > 0) {
    lines.push('Anomalies:');
    for (const f of findings) {
      lines.push(`  [${f.severity}] ${f.type}: ${f.description}`);
    }
    lines.push('');
  }

  // Interactions
  if (interactions.length > 0) {
    lines.push('User interactions:');
    for (const evt of interactions) {
      lines.push(`  ${evt.t}ms ${evt.type} ${evt.target} (${evt.x},${evt.y})`);
    }
    lines.push('');
  }

  // Visual diff
  if (visualDiff && visualDiff.entries.length > 0) {
    lines.push(visualDiff.text);
  }

  return lines.join('\n');
}

const buttonStyle = (active?: boolean) => ({
  cursor: "pointer",
  padding: "4px 10px",
  "border-radius": "4px",
  background: active ? "rgba(59, 130, 246, 0.2)" : "rgba(255, 255, 255, 0.08)",
  color: active ? "#60a5fa" : "#9ca3af",
  "font-size": "11px",
  "font-weight": "600",
  "line-height": "1.4",
  transition: "background 0.15s, color 0.15s",
});

export function RecordingResults(props: RecordingResultsProps) {
  const duration = () => props.summary?.duration ?? 0;
  const frameCount = () => props.summary?.rawFrameCount ?? 0;

  function handleCopy() {
    const text = formatDataForClipboard(
      props.data,
      props.elementPath,
      props.summary,
      props.findings,
      props.interactions,
      props.visualDiff
    );
    navigator.clipboard.writeText(text).then(() => {
      props.onToast?.("Copied to clipboard");
    });
  }

  return (
    <div
      style={{
        position: "fixed",
        bottom: "84px",
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
            Recording Results
          </div>
          <div style={{ color: "#9ca3af", "margin-top": "2px" }}>
            {Math.round(duration())}ms &middot; {frameCount()} frames
          </div>
        </div>
        <div style={{ display: "flex", "align-items": "center", gap: "4px" }}>
          <div style={buttonStyle()} onClick={handleCopy}>
            Copy
          </div>
          {props.onReplay && (
            <div style={buttonStyle(props.replaying)} onClick={props.onReplay}>
              {props.replaying ? "Replaying..." : "Replay"}
            </div>
          )}
          {props.hasPrevious && props.onLoadPrevious && (
            <div style={buttonStyle()} onClick={props.onLoadPrevious}>
              Prev
            </div>
          )}
          {props.hasNext && props.onLoadNext && (
            <div style={buttonStyle()} onClick={props.onLoadNext}>
              Next
            </div>
          )}
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

      {/* Findings */}
      <div style={{ padding: "8px 14px" }}>
        <Show
          when={props.findings.length > 0}
          fallback={
            <div
              style={{
                display: "flex",
                "align-items": "center",
                gap: "6px",
                padding: "8px 0",
                color: "#4ade80",
              }}
            >
              <span style={{ "font-size": "14px" }}>&#10003;</span>
              No anomalies detected
            </div>
          }
        >
          <div style={{ "margin-bottom": "4px", color: "#9ca3af", "font-size": "11px", "text-transform": "uppercase", "letter-spacing": "0.5px" }}>
            Findings ({props.findings.length})
          </div>
          <For each={props.findings}>
            {(finding) => (
              <div
                style={{
                  display: "flex",
                  "align-items": "flex-start",
                  gap: "8px",
                  padding: "6px 0",
                  "border-bottom": "1px solid rgba(255, 255, 255, 0.05)",
                }}
              >
                <div
                  style={{
                    width: "8px",
                    height: "8px",
                    "border-radius": "50%",
                    background: SEVERITY_COLORS[finding.severity] || "#9ca3af",
                    "flex-shrink": "0",
                    "margin-top": "3px",
                  }}
                />
                <div style={{ "min-width": "0" }}>
                  <div style={{ display: "flex", gap: "6px", "align-items": "center" }}>
                    <span style={{ "font-weight": "600", color: "#fff" }}>{finding.type}</span>
                    <span style={{ color: SEVERITY_COLORS[finding.severity], "font-size": "11px" }}>
                      {finding.severity}
                    </span>
                  </div>
                  <div
                    style={{
                      color: "#a1a1aa",
                      "margin-top": "2px",
                      "line-height": "1.4",
                      "word-break": "break-word",
                    }}
                  >
                    {finding.description}
                  </div>
                </div>
              </div>
            )}
          </For>
        </Show>
      </div>

      {/* Interactions */}
      <Show when={props.interactions.length > 0}>
        <div
          style={{
            padding: "8px 14px 12px",
            "border-top": "1px solid rgba(255, 255, 255, 0.08)",
          }}
        >
          <div style={{ "margin-bottom": "4px", color: "#9ca3af", "font-size": "11px", "text-transform": "uppercase", "letter-spacing": "0.5px" }}>
            Interactions ({props.interactions.length})
          </div>
          <For each={props.interactions}>
            {(evt) => (
              <div style={{ padding: "3px 0", color: "#a1a1aa", "font-family": "monospace", "font-size": "11px" }}>
                <span style={{ color: "#9ca3af" }}>{evt.t}ms</span>{" "}
                <span style={{ color: "#60a5fa" }}>{evt.type}</span>{" "}
                <span>{evt.target}</span>
              </div>
            )}
          </For>
        </div>
      </Show>

      {/* Visual diff */}
      <Show when={props.visualDiff && props.visualDiff.entries.length > 0}>
        <div
          style={{
            padding: "8px 14px 12px",
            "border-top": "1px solid rgba(255, 255, 255, 0.08)",
          }}
        >
          <div style={{ "margin-bottom": "4px", color: "#9ca3af", "font-size": "11px", "text-transform": "uppercase", "letter-spacing": "0.5px" }}>
            Visual diff ({props.visualDiff!.entries.length})
          </div>
          <div
            style={{
              display: "flex",
              gap: "8px",
              "margin-bottom": "6px",
              color: "#9ca3af",
              "font-size": "11px",
            }}
          >
            <Show when={props.visualDiff!.counts.added > 0}>
              <span style={{ color: "#4ade80" }}>+{props.visualDiff!.counts.added}</span>
            </Show>
            <Show when={props.visualDiff!.counts.removed > 0}>
              <span style={{ color: "#ef4444" }}>-{props.visualDiff!.counts.removed}</span>
            </Show>
            <Show when={props.visualDiff!.counts.changed > 0}>
              <span style={{ color: "#eab308" }}>~{props.visualDiff!.counts.changed}</span>
            </Show>
            <Show when={props.visualDiff!.counts.moved > 0}>
              <span style={{ color: "#60a5fa" }}>→{props.visualDiff!.counts.moved}</span>
            </Show>
            <span style={{ "margin-left": "auto" }}>
              {Math.round(props.visualDiff!.elapsedMs)}ms · settle: {props.visualDiff!.settle}
            </span>
          </div>
          <For each={props.visualDiff!.entries.slice(0, 20)}>
            {(entry) => (
              <div
                style={{
                  padding: "2px 0",
                  "font-family": "monospace",
                  "font-size": "11px",
                  color: "#a1a1aa",
                  "word-break": "break-all",
                }}
              >
                <span
                  style={{
                    color:
                      entry.type === "+"
                        ? "#4ade80"
                        : entry.type === "-"
                        ? "#ef4444"
                        : entry.type === "~"
                        ? "#eab308"
                        : "#60a5fa",
                    "font-weight": "600",
                    "margin-right": "6px",
                  }}
                >
                  {entry.type}
                </span>
                <span>{entry.label}</span>
                <Show when={entry.changedFields && entry.changedFields.length > 0}>
                  <span style={{ color: "#6b7280" }}> ({entry.changedFields!.join(", ")})</span>
                </Show>
              </div>
            )}
          </For>
          <Show when={props.visualDiff!.entries.length > 20}>
            <div style={{ color: "#6b7280", "font-size": "11px", "margin-top": "4px" }}>
              … {props.visualDiff!.entries.length - 20} more (copy to see all)
            </div>
          </Show>
        </div>
      </Show>
    </div>
  );
}
