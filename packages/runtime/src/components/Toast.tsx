import { onCleanup, onMount } from "solid-js";
import { Portal } from "solid-js/web";

export function Toast(props: { message: string; onClose: () => void }) {
  let timeoutId: ReturnType<typeof setTimeout>;

  onMount(() => {
    timeoutId = setTimeout(() => {
      props.onClose();
    }, 1500);
  });

  onCleanup(() => {
    clearTimeout(timeoutId);
  });

  return (
    <Portal mount={document.body}>
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
          "pointer-events": "none",
        }}
      >
        {props.message}
      </div>
    </Portal>
  );
}
