import { createSignal, onCleanup, onMount } from "solid-js";
import { Portal } from "solid-js/web";

const TREE_ICON = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAIAAAAlC+aJAAAAAXNSR0IArs4c6QAAAGRlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAABJADAAIAAAAUAAAAUKABAAMAAAABAAEAAKACAAQAAAABAAAAQKADAAQAAAABAAAAQAAAAAAyMDI1OjEyOjE2IDIyOjAwOjQyAHeJkHEAAAMzaVRYdFhNTDpjb20uYWRvYmUueG1wAAAAAAA8eDp4bXBtZXRhIHhtbG5zOng9ImFkb2JlOm5zOm1ldGEvIiB4OnhtcHRrPSJYTVAgQ29yZSA2LjAuMCI+CiAgIDxyZGY6UkRGIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyI+CiAgICAgIDxyZGY6RGVzY3JpcHRpb24gcmRmOmFib3V0PSIiCiAgICAgICAgICAgIHhtbG5zOnBob3Rvc2hvcD0iaHR0cDovL25zLmFkb2JlLmNvbS9waG90b3Nob3AvMS4wLyIKICAgICAgICAgICAgeG1sbnM6SXB0YzR4bXBFeHQ9Imh0dHA6Ly9pcHRjLm9yZy9zdGQvSXB0YzR4bXBFeHQvMjAwOC0wMi0yOS8iPgogICAgICAgICA8cGhvdG9zaG9wOkNyZWRpdD5NYWRlIHdpdGggR29vZ2xlIEFJPC9waG90b3Nob3A6Q3JlZGl0PgogICAgICAgICA8cGhvdG9zaG9wOkRhdGVDcmVhdGVkPjIwMjUtMTItMTZUMjI6MDA6NDI8L3Bob3Rvc2hvcDpEYXRlQ3JlYXRlZD4KICAgICAgICAgPElwdGM0eG1wRXh0OkRpZ2l0YWxTb3VyY2VGaWxlVHlwZT5odHRwOi8vY3YuaXB0Yy5vcmcvbmV3c2NvZGVzL2RpZ2l0YWxzb3VyY2V0eXBlL3RyYWluZWRBbGdvcml0aG1pY01lZGlhPC9JcHRjNHhtcEV4dDpEaWdpdGFsU291cmNlRmlsZVR5cGU+CiAgICAgICAgIDxJcHRjNHhtcEV4dDpEaWdpdGFsU291cmNlVHlwZT5odHRwOi8vY3YuaXB0Yy5vcmcvbmV3c2NvZGVzL2RpZ2l0YWxzb3VyY2V0eXBlL3RyYWluZWRBbGdvcml0aG1pY01lZGlh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";

export function Toast(props: { message: string; onClose: () => void }) {
  let timeoutId: ReturnType<typeof setTimeout>;
  const [flashOpacity, setFlashOpacity] = createSignal(1);

  onMount(() => {
    // Start flash fade after a brief moment so it's visible
    setTimeout(() => {
      setFlashOpacity(0);
    }, 100);

    timeoutId = setTimeout(() => {
      props.onClose();
    }, 1500);
  });

  onCleanup(() => {
    clearTimeout(timeoutId);
  });

  return (
    <Portal mount={document.body}>
      {/* Flash overlay */}
      <div
        style={{
          position: "fixed",
          top: "0",
          left: "0",
          right: "0",
          bottom: "0",
          width: "100vw",
          height: "100vh",
          "z-index": 99999,
          "background-color": "rgba(56, 189, 248, 0.5)",
          opacity: flashOpacity(),
          transition: "opacity 0.3s ease-out",
          "pointer-events": "none",
        }}
      />
      {/* Tree icon in bottom left */}
      <div
        style={{
          position: "fixed",
          bottom: "16px",
          left: "16px",
          "z-index": 100000,
          "pointer-events": "none",
        }}
      >
        <img
          src={TREE_ICON}
          alt="Tree"
          style={{
            width: "32px",
            height: "32px",
          }}
        />
      </div>
      {/* Toast message */}
      <div
        style={{
          position: "fixed",
          bottom: "16px",
          left: "50%",
          transform: "translateX(-50%)",
          "background-color": "#111827",
          color: "white",
          padding: "8px 16px",
          "border-radius": "8px",
          "box-shadow": "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
          "font-size": "14px",
          "z-index": 100000,
          "pointer-events": "auto",
        }}
      >
        {props.message}
      </div>
    </Portal>
  );
}
