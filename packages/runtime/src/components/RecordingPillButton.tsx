import { createSignal, For } from "solid-js";
import type { RecordingState } from "../hooks/useRecordingState";
import treeIconUrl from "../_generated_tree_icon";

type RecordingPillButtonProps = {
  locatorActive: boolean;
  recordingState: RecordingState;
  settingsOpen: boolean;
  onLocatorToggle: () => void;
  onRecordClick: () => void;
  onSettingsClick: () => void;
};

const CIRCLE_SIZE = 42;
const WRAPPER_W = 154;
const WRAPPER_H = 138;

type CircleKind = "record" | "stub1" | "settings";

type CircleDef = {
  left: number;
  top: number;
  openDelay: number;
  closeDelay: number;
  kind: CircleKind;
};

// Positions are relative to the 154x138 wrapper anchored at right:23 bottom:23.
// Button center is at (77, 87); circles sit on an arc of radius ~65 around that
// point at angles 225° / 270° / 315°.
const CIRCLES: CircleDef[] = [
  { left: 10, top: 34, openDelay: 0, closeDelay: 200, kind: "record" },
  { left: 56, top: 10, openDelay: 100, closeDelay: 100, kind: "stub1" },
  { left: 102, top: 34, openDelay: 200, closeDelay: 0, kind: "settings" },
];

export function RecordingPillButton(props: RecordingPillButtonProps) {
  const [hovered, setHovered] = createSignal(false);

  const open = () =>
    hovered() ||
    props.settingsOpen ||
    props.recordingState === "selecting" ||
    props.recordingState === "recording";

  return (
    <div
      class="fixed"
      style={{
        "z-index": "2147483646",
        bottom: "23px",
        right: "23px",
        width: WRAPPER_W + "px",
        height: WRAPPER_H + "px",
        "pointer-events": "auto",
      }}

      data-treelocator-api="window.__treelocator__"
      data-treelocator-help="window.__treelocator__.help()"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <style>{`
        @keyframes treelocator-rec-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }

        @keyframes treelocator-rec-puddle {
          0% {
            transform: translate(-50%, -50%) scale(0.9);
            opacity: 0;
          }
          20% {
            opacity: 0.38;
          }
          100% {
            transform: translate(-50%, -50%) scale(2);
            opacity: 0;
          }
        }
      `}</style>

      {/* Faint arc connecting the circles */}
      <svg
        width={WRAPPER_W}
        height={WRAPPER_H}
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
          d="M 31 55 A 65 65 0 0 1 123 55"
          fill="none"
          stroke="rgba(255, 255, 255, 0.6)"
          stroke-width="1"
        />
      </svg>

      {/* Circles */}
      <For each={CIRCLES}>
        {(circle) => (
          <div
            data-treelocator-settings-toggle={
              circle.kind === "settings" ? "" : undefined
            }
            style={{
              position: "absolute",
              left: circle.left + "px",
              top: circle.top + "px",
              width: CIRCLE_SIZE + "px",
              height: CIRCLE_SIZE + "px",
              "border-radius": "50%",
              background: "#ffffff",
              display: "flex",
              "align-items": "center",
              "justify-content": "center",
              cursor:
                circle.kind === "record" || circle.kind === "settings"
                  ? "pointer"
                  : "default",
              "box-shadow": "0 4px 14px rgba(0, 0, 0, 0.25)",
              transform: open() ? "scale(1)" : "scale(0)",
              opacity: open() ? "1" : "0",
              transition:
                "transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.2s ease-out",
              "transition-delay": open()
                ? circle.openDelay + "ms"
                : circle.closeDelay + "ms",
              "transform-origin": "center center",
              overflow: "visible",
            }}
            onClick={(e) => {
              if (circle.kind === "record") {
                e.stopPropagation();
                props.onRecordClick();
                return;
              }
              if (circle.kind === "settings") {
                e.stopPropagation();
                props.onSettingsClick();
                return;
              }
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
                : circle.kind === "settings"
                  ? props.settingsOpen
                    ? "Close settings"
                    : "Open settings"
                  : "Coming soon"
            }
            role="button"
          >
            {circle.kind === "record" ? (
              props.recordingState === "recording" ? (
                <>
                  <div
                    aria-hidden="true"
                    style={{
                      position: "absolute",
                      left: "50%",
                      top: "50%",
                      width: "42px",
                      height: "42px",
                      border: "2px solid rgba(239, 68, 68, 0.48)",
                      "border-radius": "50%",
                      transform: "translate(-50%, -50%) scale(0.9)",
                      opacity: "0",
                      filter: "blur(1px)",
                      animation:
                        "treelocator-rec-puddle 1.8s ease-out 0s infinite both",
                      "pointer-events": "none",
                      "z-index": "0",
                    }}
                  />
                  <div
                    aria-hidden="true"
                    style={{
                      position: "absolute",
                      left: "50%",
                      top: "50%",
                      width: "42px",
                      height: "42px",
                      border: "2px solid rgba(239, 68, 68, 0.4)",
                      "border-radius": "50%",
                      transform: "translate(-50%, -50%) scale(0.9)",
                      opacity: "0",
                      filter: "blur(1px)",
                      animation:
                        "treelocator-rec-puddle 1.8s ease-out 0.9s infinite both",
                      "pointer-events": "none",
                      "z-index": "0",
                    }}
                  />
                  <div
                    style={{
                      width: "14px",
                      height: "14px",
                      background: "#ef4444",
                      "border-radius": "2px",
                      "z-index": "1",
                    }}
                  />
                </>
              ) : (
                <div
                  style={{
                    width: "14px",
                    height: "14px",
                    background: "#ef4444",
                    "border-radius": "50%",
                    animation:
                      props.recordingState === "selecting"
                        ? "treelocator-rec-pulse 1s ease-in-out infinite"
                        : "none",
                  }}
                />
              )
            ) : circle.kind === "settings" ? (
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke={props.settingsOpen ? "#3b82f6" : "#1f2937"}
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            ) : null}
          </div>
        )}
      </For>

      {/* Main tree button */}
      <div
        style={{
          position: "absolute",
          right: "50px",
          bottom: "10px",
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
          transition: "box-shadow 0.2s ease-in-out",
        }}
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
