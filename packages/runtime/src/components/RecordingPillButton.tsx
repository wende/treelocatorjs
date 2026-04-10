import type { RecordingState } from "../hooks/useRecordingState";
import treeIconUrl from "../_generated_tree_icon";

type RecordingPillButtonProps = {
  locatorActive: boolean;
  recordingState: RecordingState;
  onLocatorToggle: () => void;
  onRecordClick: () => void;
};

export function RecordingPillButton(props: RecordingPillButtonProps) {
  return (
    <div
      class="fixed pointer-events-auto"
      style={{ "z-index": "2147483646", bottom: "20px", right: "20px" }}
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
      {/* Combined pill button: tree (left) | record (right) */}
      <div
        style={{
          display: "flex",
          "align-items": "stretch",
          "border-radius": "27px",
          overflow: "hidden",
          "box-shadow":
            props.locatorActive
              ? "0 0 0 3px #3b82f6, 0 4px 14px rgba(0, 0, 0, 0.25)"
              : props.recordingState === "selecting"
                ? "0 0 0 3px #3b82f6, 0 4px 14px rgba(0, 0, 0, 0.25)"
                : props.recordingState === "recording"
                  ? "0 0 0 3px #ef4444, 0 4px 14px rgba(0, 0, 0, 0.25)"
                  : "0 4px 14px rgba(0, 0, 0, 0.25)",
          transition: "box-shadow 0.2s ease-in-out",
        }}
      >
        {/* Left half: Tree icon */}
        <div
          style={{
            width: "54px",
            height: "54px",
            background: "#ffffff",
            display: "flex",
            "align-items": "center",
            "justify-content": "center",
            cursor: "pointer",
            overflow: "hidden",
            "border-right": "1px solid rgba(0, 0, 0, 0.1)",
            transition: "background 0.15s ease-in-out",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "#f0f0f0")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "#ffffff")
          }
          onClick={() => props.onLocatorToggle()}
          aria-label="TreeLocatorJS: Get component paths using window.__treelocator__.getPath(selector)"
          role="button"
        >
          <img
            src={treeIconUrl}
            alt="TreeLocatorJS"
            width={44}
            height={44}
          />
        </div>
        {/* Right half: Record button */}
        <div
          style={{
            width: "54px",
            height: "54px",
            background:
              props.recordingState === "recording" ? "#ef4444" : "#ffffff",
            display: "flex",
            "align-items": "center",
            "justify-content": "center",
            cursor: "pointer",
            transition: "background 0.15s ease-in-out",
          }}
          onMouseEnter={(e) => {
            if (props.recordingState !== "recording")
              e.currentTarget.style.background = "#f0f0f0";
          }}
          onMouseLeave={(e) => {
            if (props.recordingState !== "recording")
              e.currentTarget.style.background = "#ffffff";
          }}
          onClick={() => props.onRecordClick()}
          aria-label={
            props.recordingState === "idle"
              ? "Record element changes. API: window.__treelocator__.replayWithRecord(selector)"
              : props.recordingState === "selecting"
                ? "Cancel recording selection"
                : props.recordingState === "recording"
                  ? "Stop recording"
                  : "Dismiss results"
          }
          role="button"
        >
          {props.recordingState === "recording" ? (
            <div
              style={{
                width: "18px",
                height: "18px",
                background: "#fff",
                "border-radius": "3px",
              }}
            />
          ) : (
            <div
              style={{
                width: "18px",
                height: "18px",
                background: "#ef4444",
                "border-radius": "50%",
                animation:
                  props.recordingState === "selecting"
                    ? "treelocator-rec-pulse 1s ease-in-out infinite"
                    : "none",
              }}
            />
          )}
        </div>
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
