import { createSignal, onCleanup, onMount } from "solid-js";

type RecordingOutlineProps = {
  element: HTMLElement;
};

export function RecordingOutline(props: RecordingOutlineProps) {
  const [box, setBox] = createSignal(props.element.getBoundingClientRect());

  let rafId: number;
  const updateBox = () => {
    setBox(props.element.getBoundingClientRect());
    rafId = requestAnimationFrame(updateBox);
  };
  onMount(() => {
    rafId = requestAnimationFrame(updateBox);
  });
  onCleanup(() => cancelAnimationFrame(rafId));

  return (
    <div
      style={{
        position: "fixed",
        "z-index": "2",
        left: box().x + "px",
        top: box().y + "px",
        width: box().width + "px",
        height: box().height + "px",
        border: "2px dashed #ef4444",
        "border-radius": "2px",
        "pointer-events": "none",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "-22px",
          left: "4px",
          display: "flex",
          "align-items": "center",
          gap: "4px",
          padding: "2px 8px",
          background: "rgba(239, 68, 68, 0.9)",
          "border-radius": "4px",
          color: "#fff",
          "font-size": "10px",
          "font-family": "system-ui, sans-serif",
          "font-weight": "600",
          "letter-spacing": "0.5px",
          "white-space": "nowrap",
        }}
      >
        <div
          style={{
            width: "6px",
            height: "6px",
            "border-radius": "50%",
            background: "#fff",
            animation: "treelocator-rec-pulse 1s ease-in-out infinite",
          }}
        />
        REC
      </div>
    </div>
  );
}
