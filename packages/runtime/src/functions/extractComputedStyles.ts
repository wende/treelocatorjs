/**
 * Extracts and formats computed styles from a DOM element.
 * Output is optimized for AI consumption — minimal tokens, maximum signal.
 */

// --- Types ---

export interface StyleSnapshot {
  properties: Record<string, string>;
  boundingRect: {
    x: number;
    y: number;
    width: number;
    height: number;
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

export interface ComputedStylesResult {
  formatted: string;
  snapshot: StyleSnapshot;
}

// --- Property Groups (longhands read from getComputedStyle) ---

const LAYOUT_PROPERTIES = [
  "display",
  "position",
  "top",
  "right",
  "bottom",
  "left",
  "width",
  "height",
  "min-width",
  "max-width",
  "min-height",
  "max-height",
  "box-sizing",
  "overflow-x",
  "overflow-y",
  "flex-direction",
  "flex-wrap",
  "flex-grow",
  "flex-shrink",
  "flex-basis",
  "align-items",
  "align-self",
  "align-content",
  "justify-content",
  "justify-self",
  "grid-template-columns",
  "grid-template-rows",
  "grid-area",
  "gap",
  "column-gap",
  "row-gap",
  "margin-top",
  "margin-right",
  "margin-bottom",
  "margin-left",
  "padding-top",
  "padding-right",
  "padding-bottom",
  "padding-left",
  "z-index",
  "float",
  "clear",
];

const VISUAL_PROPERTIES = [
  "background-color",
  "background-image",
  "background-size",
  "background-position",
  "color",
  "border-top-width",
  "border-right-width",
  "border-bottom-width",
  "border-left-width",
  "border-top-style",
  "border-right-style",
  "border-bottom-style",
  "border-left-style",
  "border-top-color",
  "border-right-color",
  "border-bottom-color",
  "border-left-color",
  "border-top-left-radius",
  "border-top-right-radius",
  "border-bottom-right-radius",
  "border-bottom-left-radius",
  "outline-width",
  "outline-style",
  "outline-color",
  "box-shadow",
  "opacity",
  "visibility",
  "transform",
  "transition",
  "animation",
];

const TYPOGRAPHY_PROPERTIES = [
  "font-family",
  "font-size",
  "font-weight",
  "font-style",
  "line-height",
  "letter-spacing",
  "text-align",
  "text-decoration",
  "text-transform",
  "white-space",
  "word-break",
];

const INTERACTION_PROPERTIES = [
  "cursor",
  "pointer-events",
  "user-select",
];

const SVG_PROPERTIES = [
  "fill",
  "stroke",
  "stroke-width",
  "stroke-dasharray",
  "stroke-dashoffset",
  "stroke-linecap",
  "stroke-linejoin",
  "fill-opacity",
  "stroke-opacity",
];

const ALL_PROPERTIES = [
  ...LAYOUT_PROPERTIES,
  ...VISUAL_PROPERTIES,
  ...TYPOGRAPHY_PROPERTIES,
  ...INTERACTION_PROPERTIES,
];

const ALL_PROPERTIES_WITH_SVG = [...ALL_PROPERTIES, ...SVG_PROPERTIES];

// Values that are always excluded regardless of defaults comparison
const ALWAYS_EXCLUDE_VALUES = new Set(["initial", "inherit", "unset"]);

// --- Property Groups Definition ---

interface PropertyGroup {
  name: string;
  props: string[];
}

function getPropertyGroups(isSvg: boolean): PropertyGroup[] {
  const groups: PropertyGroup[] = [
    { name: "Layout", props: LAYOUT_PROPERTIES },
    { name: "Visual", props: VISUAL_PROPERTIES },
    { name: "Typography", props: TYPOGRAPHY_PROPERTIES },
    { name: "Interaction", props: INTERACTION_PROPERTIES },
  ];
  if (isSvg) {
    groups.push({ name: "SVG", props: SVG_PROPERTIES });
  }
  return groups;
}

// --- Default Detection via Temp Element ---

/**
 * Cache of default computed styles per tag name (+ SVG namespace marker).
 * Browser defaults for a given tag are constant within a page load, so we
 * avoid creating a temporary element and triggering layout on every click.
 */
const defaultStylesCache = new Map<string, Map<string, string>>();

function getDefaultStyles(
  element: Element,
  properties: string[]
): Map<string, string> {
  const tagName = element.tagName.toLowerCase();
  const isSvgElement =
    element.namespaceURI === "http://www.w3.org/2000/svg";
  const cacheKey = `${isSvgElement ? "svg:" : ""}${tagName}`;

  const cached = defaultStylesCache.get(cacheKey);
  if (cached) return cached;

  const defaults = new Map<string, string>();
  try {
    const temp = isSvgElement
      ? document.createElementNS("http://www.w3.org/2000/svg", tagName)
      : document.createElement(tagName);
    if (temp instanceof HTMLElement || temp instanceof SVGElement) {
      (temp as HTMLElement | SVGElement).style.cssText =
        "position:fixed!important;visibility:hidden!important;pointer-events:none!important;left:-9999px!important;top:-9999px!important;width:auto!important;height:auto!important;";
    }
    document.body.appendChild(temp);
    const computed = window.getComputedStyle(temp);
    for (const prop of properties) {
      defaults.set(prop, computed.getPropertyValue(prop));
    }
    document.body.removeChild(temp);
    defaultStylesCache.set(cacheKey, defaults);
  } catch {
    // Fallback: empty defaults means nothing gets filtered. Do not cache
    // a partial result so a future call can retry.
  }
  return defaults;
}

// --- Shorthand Collapse Helpers ---

function collapseFourValues(
  top: string,
  right: string,
  bottom: string,
  left: string
): string {
  if (top === right && right === bottom && bottom === left) return top;
  if (top === bottom && right === left) return `${top} ${right}`;
  if (right === left) return `${top} ${right} ${bottom}`;
  return `${top} ${right} ${bottom} ${left}`;
}

interface GroupedEntry {
  name: string;
  value: string;
}

function processGroupEntries(
  groupProps: string[],
  values: Record<string, string>,
  isNonDefault: (prop: string, value: string) => boolean
): GroupedEntry[] {
  const entries: GroupedEntry[] = [];
  const consumed = new Set<string>();

  // --- Margin shorthand ---
  tryFourValueShorthand(
    "margin",
    ["margin-top", "margin-right", "margin-bottom", "margin-left"],
    groupProps,
    values,
    isNonDefault,
    entries,
    consumed
  );

  // --- Padding shorthand ---
  tryFourValueShorthand(
    "padding",
    ["padding-top", "padding-right", "padding-bottom", "padding-left"],
    groupProps,
    values,
    isNonDefault,
    entries,
    consumed
  );

  // --- Overflow shorthand ---
  tryTwoValueShorthand(
    "overflow",
    ["overflow-x", "overflow-y"],
    groupProps,
    values,
    isNonDefault,
    entries,
    consumed
  );

  // --- Flex shorthand ---
  tryFlexShorthand(groupProps, values, isNonDefault, entries, consumed);

  // --- Border shorthand ---
  tryBorderShorthand(groupProps, values, isNonDefault, entries, consumed);

  // --- Border-radius shorthand ---
  tryFourValueShorthand(
    "border-radius",
    [
      "border-top-left-radius",
      "border-top-right-radius",
      "border-bottom-right-radius",
      "border-bottom-left-radius",
    ],
    groupProps,
    values,
    isNonDefault,
    entries,
    consumed
  );

  // --- Outline shorthand ---
  tryOutlineShorthand(groupProps, values, isNonDefault, entries, consumed);

  // --- Remaining individual properties ---
  for (const prop of groupProps) {
    if (consumed.has(prop)) continue;
    const value = values[prop];
    if (value && isNonDefault(prop, value)) {
      entries.push({ name: prop, value });
    }
  }

  return entries;
}

function tryFourValueShorthand(
  shorthand: string,
  longhands: string[],
  groupProps: string[],
  values: Record<string, string>,
  isNonDefault: (prop: string, value: string) => boolean,
  entries: GroupedEntry[],
  consumed: Set<string>
): void {
  if (!longhands.every((l) => groupProps.includes(l))) return;

  const vals = longhands.map((l) => values[l] || "");
  const nonDefaultIndices = longhands.filter((l, i) =>
    isNonDefault(l, vals[i]!)
  );

  if (nonDefaultIndices.length === 0) {
    longhands.forEach((l) => consumed.add(l));
    return;
  }

  if (nonDefaultIndices.length >= 2) {
    const collapsed = collapseFourValues(
      vals[0]!,
      vals[1]!,
      vals[2]!,
      vals[3]!
    );
    entries.push({ name: shorthand, value: collapsed });
    longhands.forEach((l) => consumed.add(l));
  }
  // If only 1 non-default, let it be output as individual longhand
}

function tryTwoValueShorthand(
  shorthand: string,
  longhands: [string, string],
  groupProps: string[],
  values: Record<string, string>,
  isNonDefault: (prop: string, value: string) => boolean,
  entries: GroupedEntry[],
  consumed: Set<string>
): void {
  if (!longhands.every((l) => groupProps.includes(l))) return;

  const a = values[longhands[0]] || "";
  const b = values[longhands[1]] || "";
  const aNonDefault = isNonDefault(longhands[0], a);
  const bNonDefault = isNonDefault(longhands[1], b);

  if (!aNonDefault && !bNonDefault) {
    longhands.forEach((l) => consumed.add(l));
    return;
  }

  if (aNonDefault && bNonDefault) {
    if (a === b) {
      entries.push({ name: shorthand, value: a });
    } else {
      entries.push({ name: shorthand, value: `${a} ${b}` });
    }
    longhands.forEach((l) => consumed.add(l));
  }
  // If only one is non-default, let it output individually
}

function tryFlexShorthand(
  groupProps: string[],
  values: Record<string, string>,
  isNonDefault: (prop: string, value: string) => boolean,
  entries: GroupedEntry[],
  consumed: Set<string>
): void {
  const longhands = ["flex-grow", "flex-shrink", "flex-basis"];
  if (!longhands.every((l) => groupProps.includes(l))) return;

  const nonDefaultCount = longhands.filter((l) =>
    isNonDefault(l, values[l] || "")
  ).length;

  if (nonDefaultCount === 0) {
    longhands.forEach((l) => consumed.add(l));
    return;
  }

  if (nonDefaultCount >= 2) {
    entries.push({
      name: "flex",
      value: `${values["flex-grow"]} ${values["flex-shrink"]} ${values["flex-basis"]}`,
    });
    longhands.forEach((l) => consumed.add(l));
  }
}

function tryBorderShorthand(
  groupProps: string[],
  values: Record<string, string>,
  isNonDefault: (prop: string, value: string) => boolean,
  entries: GroupedEntry[],
  consumed: Set<string>
): void {
  const sides = ["top", "right", "bottom", "left"];
  const widths = sides.map((s) => `border-${s}-width`);
  const styles = sides.map((s) => `border-${s}-style`);
  const colors = sides.map((s) => `border-${s}-color`);
  const allProps = [...widths, ...styles, ...colors];

  if (!allProps.every((p) => groupProps.includes(p))) return;

  const anyNonDefault = allProps.some((p) =>
    isNonDefault(p, values[p] || "")
  );
  if (!anyNonDefault) {
    allProps.forEach((p) => consumed.add(p));
    return;
  }

  const wVals = widths.map((p) => values[p] || "");
  const sVals = styles.map((p) => values[p] || "");
  const cVals = colors.map((p) => values[p] || "");

  const allSameW = wVals.every((v) => v === wVals[0]);
  const allSameS = sVals.every((v) => v === sVals[0]);
  const allSameC = cVals.every((v) => v === cVals[0]);

  if (allSameW && allSameS && allSameC) {
    // All sides identical — use single shorthand
    if (sVals[0] !== "none") {
      entries.push({
        name: "border",
        value: `${wVals[0]} ${sVals[0]} ${cVals[0]}`,
      });
    }
    allProps.forEach((p) => consumed.add(p));
    return;
  }

  // Per-side shorthands for non-uniform borders
  for (let i = 0; i < sides.length; i++) {
    const side = sides[i]!;
    const sideProps = [widths[i]!, styles[i]!, colors[i]!];
    const anySideNonDefault = sideProps.some((p) =>
      isNonDefault(p, values[p] || "")
    );

    if (anySideNonDefault && sVals[i] !== "none") {
      entries.push({
        name: `border-${side}`,
        value: `${wVals[i]} ${sVals[i]} ${cVals[i]}`,
      });
    }
    sideProps.forEach((p) => consumed.add(p));
  }
}

function tryOutlineShorthand(
  groupProps: string[],
  values: Record<string, string>,
  isNonDefault: (prop: string, value: string) => boolean,
  entries: GroupedEntry[],
  consumed: Set<string>
): void {
  const longhands = ["outline-width", "outline-style", "outline-color"];
  if (!longhands.every((l) => groupProps.includes(l))) return;

  const anyNonDefault = longhands.some((l) =>
    isNonDefault(l, values[l] || "")
  );
  if (!anyNonDefault) {
    longhands.forEach((l) => consumed.add(l));
    return;
  }

  const outlineStyle = values["outline-style"] || "none";
  if (outlineStyle !== "none") {
    entries.push({
      name: "outline",
      value: `${values["outline-width"]} ${values["outline-style"]} ${values["outline-color"]}`,
    });
  }
  longhands.forEach((l) => consumed.add(l));
}

// --- Diff Mode ---

// WeakRef is only guaranteed in modern runtimes (Chrome 84+, Safari 14.1+,
// Firefox 79+, Node 14.6+). Guard access so the runtime doesn't throw a
// ReferenceError in older environments; we fall back to a strong reference.
const HAS_WEAK_REF = typeof (globalThis as any).WeakRef !== "undefined";

type ElementHolder = {
  deref: () => Element | undefined;
};

function makeElementHolder(element: Element): ElementHolder {
  if (HAS_WEAK_REF) {
    const ref = new (globalThis as any).WeakRef(element) as {
      deref: () => Element | undefined;
    };
    return { deref: () => ref.deref() };
  }
  // Fallback: strong reference. Prevents GC of the element, but that's
  // bounded by DIFF_WINDOW_MS because we overwrite lastSnapshot on each call.
  return { deref: () => element };
}

let lastSnapshot: {
  elementRef: ElementHolder;
  snapshot: StyleSnapshot;
  timestamp: number;
} | null = null;

const DIFF_WINDOW_MS = 30000;

function formatDiff(
  prev: StyleSnapshot,
  curr: StyleSnapshot,
  elementLabel: string | undefined
): string {
  const lines: string[] = [];

  const header = elementLabel
    ? `[ComputedStyles \u0394] ${elementLabel}`
    : "[ComputedStyles \u0394]";
  lines.push(header);
  lines.push("\u2500".repeat(Math.max(header.length, 40)));

  const allProps = new Set([
    ...Object.keys(prev.properties),
    ...Object.keys(curr.properties),
  ]);

  const changes: string[] = [];

  for (const prop of allProps) {
    const prevVal = prev.properties[prop] || "";
    const currVal = curr.properties[prop] || "";
    if (prevVal === currVal) continue;

    if (!prevVal || ALWAYS_EXCLUDE_VALUES.has(prevVal)) {
      changes.push(`+ ${prop}: ${currVal}`);
    } else if (!currVal || ALWAYS_EXCLUDE_VALUES.has(currVal)) {
      changes.push(`- ${prop}: ${prevVal}`);
    } else {
      changes.push(`~ ${prop}: ${prevVal} \u2192 ${currVal}`);
    }
  }

  const rectKeys = ["x", "y", "width", "height"] as const;
  const rectChanges: string[] = [];
  for (const key of rectKeys) {
    const p = prev.boundingRect[key];
    const c = curr.boundingRect[key];
    if (p !== c) {
      rectChanges.push(`~ ${key}: ${p} \u2192 ${c}`);
    }
  }

  if (changes.length === 0 && rectChanges.length === 0) {
    lines.push("");
    lines.push("No changes detected");
  } else {
    if (changes.length > 0) {
      lines.push("");
      for (const change of changes) {
        lines.push(change);
      }
    }
    if (rectChanges.length > 0) {
      lines.push("");
      lines.push("BoundingRect");
      for (const change of rectChanges) {
        lines.push(change);
      }
    }
  }

  return lines.join("\n");
}

// --- Main Extraction Function ---

export interface ExtractOptions {
  /**
   * Skip diff-mode detection and always return the full formatted styles.
   * Used by internal call sites that re-extract for the same element within
   * the diff window (e.g. source-map enrichment re-runs in Runtime.tsx) where
   * returning a "No changes detected" delta would be incorrect.
   */
  forceFull?: boolean;
}

export function extractComputedStyles(
  element: Element,
  elementLabel?: string,
  options: ExtractOptions = {}
): ComputedStylesResult {
  const isSvg = element instanceof SVGElement;
  const properties = isSvg ? ALL_PROPERTIES_WITH_SVG : ALL_PROPERTIES;

  const computed = window.getComputedStyle(element);

  // Read all property values
  const values: Record<string, string> = {};
  for (const prop of properties) {
    values[prop] = computed.getPropertyValue(prop);
  }

  // Get bounding rect
  const rect = element.getBoundingClientRect();
  const boundingRect = {
    x: Math.round(rect.x),
    y: Math.round(rect.y),
    width: Math.round(rect.width),
    height: Math.round(rect.height),
    top: Math.round(rect.top),
    right: Math.round(rect.right),
    bottom: Math.round(rect.bottom),
    left: Math.round(rect.left),
  };

  const snapshot: StyleSnapshot = { properties: values, boundingRect };

  // Check for diff mode: same element clicked again within the time window.
  // `forceFull` bypasses diff mode so callers that re-extract for labelling
  // purposes (e.g. source-map enrichment) always get the full style dump.
  let diffMode = false;
  let previousSnapshot: StyleSnapshot | null = null;
  if (lastSnapshot && !options.forceFull) {
    const prevElement = lastSnapshot.elementRef.deref();
    if (
      prevElement === element &&
      Date.now() - lastSnapshot.timestamp < DIFF_WINDOW_MS
    ) {
      diffMode = true;
      previousSnapshot = lastSnapshot.snapshot;
    }
  }

  // Store current snapshot for future diff
  lastSnapshot = {
    elementRef: makeElementHolder(element),
    snapshot,
    timestamp: Date.now(),
  };

  if (diffMode && previousSnapshot) {
    return {
      formatted: formatDiff(previousSnapshot, snapshot, elementLabel),
      snapshot,
    };
  }

  // Normal mode: filter defaults and format
  const defaults = getDefaultStyles(element, properties);

  const isNonDefault = (prop: string, value: string): boolean => {
    if (!value || value === "") return false;
    if (ALWAYS_EXCLUDE_VALUES.has(value)) return false;
    return defaults.get(prop) !== value;
  };

  const lines: string[] = [];

  // Header
  const header = elementLabel
    ? `[ComputedStyles] ${elementLabel}`
    : "[ComputedStyles]";
  lines.push(header);
  lines.push("\u2500".repeat(Math.max(header.length, 40)));

  // Process each property group
  const groups = getPropertyGroups(isSvg);
  for (const group of groups) {
    const entries = processGroupEntries(
      group.props,
      values,
      isNonDefault
    );
    if (entries.length > 0) {
      lines.push("");
      lines.push(group.name);
      for (const entry of entries) {
        lines.push(`  ${entry.name}: ${entry.value}`);
      }
    }
  }

  // Bounding rect always last
  lines.push("");
  lines.push("BoundingRect");
  lines.push(
    `  x: ${boundingRect.x}  y: ${boundingRect.y}  width: ${boundingRect.width}  height: ${boundingRect.height}`
  );

  return { formatted: lines.join("\n"), snapshot };
}

// Exported for testing
export {
  collapseFourValues as _collapseFourValues,
  processGroupEntries as _processGroupEntries,
  formatDiff as _formatDiff,
  LAYOUT_PROPERTIES,
  VISUAL_PROPERTIES,
  TYPOGRAPHY_PROPERTIES,
  INTERACTION_PROPERTIES,
  SVG_PROPERTIES,
};
