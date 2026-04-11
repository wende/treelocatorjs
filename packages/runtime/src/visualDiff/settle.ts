export const DEFAULT_SETTLE_TIMEOUT_MS = 3000;
export const MUTATION_SILENCE_MS = 150;

function nextFrame(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof requestAnimationFrame === "function") {
      requestAnimationFrame(() => resolve());
    } else {
      setTimeout(() => resolve(), 16);
    }
  });
}

function animationsRunning(): boolean {
  if (
    typeof document === "undefined" ||
    typeof (document as Document).getAnimations !== "function"
  ) {
    return false;
  }
  const anims = (document as Document).getAnimations();
  for (const a of anims) {
    if (a.playState === "running") return true;
  }
  return false;
}

export async function waitForSettle(
  timeoutMs: number = DEFAULT_SETTLE_TIMEOUT_MS,
  root?: Node
): Promise<"clean" | "timeout"> {
  if (typeof document === "undefined" || typeof MutationObserver === "undefined") {
    return "clean";
  }

  const observeTarget = root ?? document.documentElement;
  const deadline = performance.now() + timeoutMs;
  let lastMutation = performance.now();

  const mo = new MutationObserver(() => {
    lastMutation = performance.now();
  });
  mo.observe(observeTarget, {
    childList: true,
    subtree: true,
    attributes: true,
    characterData: true,
  });

  try {
    while (performance.now() < deadline) {
      const sinceMutation = performance.now() - lastMutation;
      if (!animationsRunning() && sinceMutation >= MUTATION_SILENCE_MS) {
        return "clean";
      }
      await nextFrame();
    }
    return "timeout";
  } finally {
    mo.disconnect();
  }
}
