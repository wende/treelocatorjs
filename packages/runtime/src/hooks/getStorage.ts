type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function isStorageLike(value: unknown): value is StorageLike {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<StorageLike>;
  return (
    typeof candidate.getItem === "function" &&
    typeof candidate.setItem === "function" &&
    typeof candidate.removeItem === "function"
  );
}

export function getStorage(): StorageLike | null {
  try {
    if (typeof window !== "undefined" && isStorageLike(window.localStorage)) {
      return window.localStorage;
    }
  } catch {
    // Ignore localStorage access errors (SSR, permissions, opaque origin)
  }

  const candidate = (globalThis as { localStorage?: unknown }).localStorage;
  if (isStorageLike(candidate)) return candidate;

  return null;
}
