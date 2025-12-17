import { createSignal, onCleanup, onMount } from "solid-js";
import { Portal } from "solid-js/web";
import TREE_ICON from "../_generated_tree_icon";

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
