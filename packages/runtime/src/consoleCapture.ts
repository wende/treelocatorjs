export type ConsoleLevel = "log" | "info" | "warn" | "error" | "debug";

export interface ConsoleEntry {
  level: ConsoleLevel;
  timestamp: number;
  message: string;
}

const MAX_ENTRIES = 500;
const LEVELS: ConsoleLevel[] = ["log", "info", "warn", "error", "debug"];

const CAPTURE_FLAG = "__treelocator_console_captured__";
const entries: ConsoleEntry[] = [];

function formatArg(value: unknown, seen: WeakSet<object>): string {
  if (value === null) return "null";
  if (value === undefined) return "undefined";
  const t = typeof value;
  if (t === "string") return value as string;
  if (t === "number" || t === "boolean" || t === "bigint") return String(value);
  if (t === "function") {
    const name = (value as { name?: string }).name || "anonymous";
    return `[Function: ${name}]`;
  }
  if (value instanceof Error) {
    return `${value.name}: ${value.message}`;
  }
  if (typeof Element !== "undefined" && value instanceof Element) {
    const el = value as Element;
    const id = el.id ? `#${el.id}` : "";
    const cls = el.className && typeof el.className === "string"
      ? `.${el.className.trim().split(/\s+/).join(".")}`
      : "";
    return `<${el.tagName.toLowerCase()}${id}${cls}>`;
  }
  if (t === "object") {
    if (seen.has(value as object)) return "[Circular]";
    seen.add(value as object);
    try {
      const localSeen = new WeakSet<object>();
      return JSON.stringify(value, (_key, v) => {
        if (v === null || v === undefined) return v;
        if (typeof v === "bigint") return v.toString();
        if (typeof v === "function") return `[Function: ${v.name || "anonymous"}]`;
        if (typeof v === "object") {
          if (localSeen.has(v)) return "[Circular]";
          localSeen.add(v);
        }
        return v;
      });
    } catch {
      try {
        return String(value);
      } catch {
        return "[Unserializable]";
      }
    }
  }
  return String(value);
}

function formatArgs(args: unknown[]): string {
  const seen = new WeakSet<object>();
  return args.map((arg) => formatArg(arg, seen)).join(" ");
}

function pushEntry(level: ConsoleLevel, args: unknown[]): void {
  entries.push({
    level,
    timestamp: Date.now(),
    message: formatArgs(args),
  });
  if (entries.length > MAX_ENTRIES) {
    entries.splice(0, entries.length - MAX_ENTRIES);
  }
}

export function installConsoleCapture(): void {
  if (typeof console === "undefined") return;
  const target = console as unknown as Record<string, unknown>;
  if (target[CAPTURE_FLAG]) return;
  target[CAPTURE_FLAG] = true;

  for (const level of LEVELS) {
    const original = target[level];
    if (typeof original !== "function") continue;
    const wrapped = function (this: unknown, ...args: unknown[]) {
      try {
        pushEntry(level, args);
      } catch {
        // Swallow — capture must never break logging.
      }
      return (original as (...a: unknown[]) => unknown).apply(this, args);
    };
    try {
      target[level] = wrapped;
    } catch {
      // Some environments freeze console — ignore.
    }
  }
}

export function getConsoleEntries(last?: number): ConsoleEntry[] {
  if (typeof last !== "number" || !Number.isFinite(last) || last <= 0) {
    return entries.slice();
  }
  const n = Math.min(Math.floor(last), entries.length);
  return entries.slice(entries.length - n);
}

export function clearConsoleEntries(): void {
  entries.length = 0;
}
