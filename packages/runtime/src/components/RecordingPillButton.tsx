import { createSignal, For } from "solid-js";
import type { RecordingState } from "../hooks/useRecordingState";
import treeIconUrl from "../_generated_tree_icon";

type RecordingPillButtonProps = {
  locatorActive: boolean;
  recordingState: RecordingState;
  onLocatorToggle: () => void;
  onRecordClick: () => void;
};

const CIRCLE_SIZE = 42;

type CircleKind = "record" | "stub1" | "stub2";

type CircleDef = {
  left: number;
  top: number;
  openDelay: number;
  closeDelay: number;
  kind: CircleKind;
};

// Positions are relative to the 200x170 container anchored bottom-right.
// Button center in its hovered position is at (100, 110); circles sit on an
// arc of radius ~65 around that point at angles 225° / 270° / 315°.
const CIRCLES: CircleDef[] = [
  { left: 33, top: 43, openDelay: 0, closeDelay: 200, kind: "record" },
  { left: 79, top: 19, openDelay: 100, closeDelay: 100, kind: "stub1" },
  { left: 125, top: 43, openDelay: 200, closeDelay: 0, kind: "stub2" },
];

export function RecordingPillButton(props: RecordingPillButtonProps) {
  const [hovered, setHovered] = createSignal(false);

  const open = () =>
    hovered() ||
    props.recordingState === "selecting" ||
    props.recordingState === "recording";

  return (
    <div
      class="fixed"
      style={{
        "z-index": "2147483646",
        bottom: "0",
        right: "0",
        width: "200px",
        height: "170px",
        "pointer-events": "none",
      }}
      title="TreeLocatorJS - Component Ancestry Tracker"
      data-treelocator-api="window.__treelocator__"
      data-treelocator-help="window.__treelocator__.help()"
    >
      <style>{`
        @keyframes treelocator-rec-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>

      {/* Hover frame — catches mouseleave while the menu is open */}
      <div
        style={{
          position: "absolute",
          inset: "0",
          "pointer-events": open() ? "auto" : "none",
        }}
        onMouseLeave={() => setHovered(false)}
      />

      {/* Faint arc connecting the circles */}
      <svg
        width="200"
        height="170"
        style={{
          position: "absolute",
          left: "0",
          top: "0",
          "pointer-events": "none",
          opacity: open() ? "0.4" : "0",
          transition: "opacity 0.3s ease-out",
          "transition-delay": open() ? "50ms" : "0ms",
        }}
      >
        <path
          d="M 54 64 A 65 65 0 0 1 146 64"
          fill="none"
          stroke="rgba(255, 255, 255, 0.6)"
          stroke-width="1"
        />
      </svg>

      {/* Circles */}
      <For each={CIRCLES}>
        {(circle) => (
          <div
            style={{
              position: "absolute",
              left: circle.left + "px",
              top: circle.top + "px",
              width: CIRCLE_SIZE + "px",
              height: CIRCLE_SIZE + "px",
              "border-radius": "50%",
              background: "#ef4444",
              display: "flex",
              "align-items": "center",
              "justify-content": "center",
              cursor: circle.kind === "record" ? "pointer" : "default",
              "box-shadow":
                "0 6px 14px rgba(239, 68, 68, 0.35), 0 2px 4px rgba(0, 0, 0, 0.2)",
              transform: open() ? "scale(1)" : "scale(0)",
              opacity: open() ? "1" : "0",
              transition:
                "transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.2s ease-out",
              "transition-delay": open()
                ? circle.openDelay + "ms"
                : circle.closeDelay + "ms",
              "pointer-events": open() ? "auto" : "none",
              "transform-origin": "center center",
            }}
            onClick={(e) => {
              if (circle.kind !== "record") return;
              e.stopPropagation();
              props.onRecordClick();
            }}
            aria-label={
              circle.kind === "record"
                ? props.recordingState === "idle"
                  ? "Record element changes"
                  : props.recordingState === "selecting"
                    ? "Cancel recording selection"
                    : props.recordingState === "recording"
                      ? "Stop recording"
                      : "Dismiss results"
                : "Coming soon"
            }
            role="button"
          >
            {circle.kind === "record" ? (
              props.recordingState === "recording" ? (
                <div
                  style={{
                    width: "14px",
                    height: "14px",
                    background: "#fff",
                    "border-radius": "2px",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: "14px",
                    height: "14px",
                    background: "#fff",
                    "border-radius": "50%",
                    animation:
                      props.recordingState === "selecting"
                        ? "treelocator-rec-pulse 1s ease-in-out infinite"
                        : "none",
                  }}
                />
              )
            ) : null}
          </div>
        )}
      </For>

      {/* Main tree button — slides up-left slightly when the menu is open */}
      <div
        style={{
          position: "absolute",
          right: "20px",
          bottom: "20px",
          width: "54px",
          height: "54px",
          "border-radius": "50%",
          background: "#ffffff",
          display: "flex",
          "align-items": "center",
          "justify-content": "center",
          cursor: "pointer",
          overflow: "hidden",
          "box-shadow": props.locatorActive
            ? "0 0 0 3px #3b82f6, 0 4px 14px rgba(0, 0, 0, 0.25)"
            : "0 4px 14px rgba(0, 0, 0, 0.25)",
          transform: open()
            ? "translate(-53px, -13px) scale(1.05)"
            : "translate(0, 0) scale(1)",
          transition:
            "transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease-in-out",
          "pointer-events": "auto",
        }}
        onMouseEnter={() => setHovered(true)}
        onClick={(e) => {
          e.stopPropagation();
          props.onLocatorToggle();
        }}
        aria-label="TreeLocatorJS: Get component paths using window.__treelocator__.getPath(selector)"
        role="button"
      >
        <img src={treeIconUrl} alt="TreeLocatorJS" width={44} height={44} />
      </div>

      <div
        role="note"
        aria-label="TreeLocatorJS Developer Tool API — Run: window.__treelocator__.help() for full usage instructions. Quick start: window.__treelocator__.getPath('button.submit') returns component ancestry. window.__treelocator__.replayWithRecord('.my-element') replays recorded interactions while tracking visual changes."
        style={{
          position: "absolute",
          width: "1px",
          height: "1px",
          padding: "0",
          margin: "-1px",
          overflow: "hidden",
          clip: "rect(0,0,0,0)",
          "white-space": "nowrap",
          border: "0",
        }}
      >
        TreeLocatorJS: Run window.__treelocator__.help() for API docs
      </div>
    </div>
  );
}
