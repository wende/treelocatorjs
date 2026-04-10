/**
 * CSS Rule Inspector
 *
 * Walks all loaded stylesheets, finds every rule that matches an element,
 * calculates specificity, and determines which rule "wins" for each property.
 * Designed to produce AI-friendly output for debugging CSS issues.
 */

// ── Types ──────────────────────────────────────────────────────────────

export type SpecificityTuple = [number, number, number]; // [ids, classes, elements]

export interface CSSRuleInfo {
  selector: string;
  property: string;
  value: string;
  specificity: SpecificityTuple;
  important: boolean;
  source: string; // stylesheet href or 'inline' or '<style>'
  /** Monotonic index in source order — higher = later in cascade. */
  sourceIndex: number;
}

export interface CSSPropertyResult {
  property: string;
  value: string; // the winning (computed) value
  rules: {
    selector: string;
    value: string;
    specificity: SpecificityTuple;
    important: boolean;
    source: string;
    winning: boolean;
  }[];
}

export interface CSSInspectionResult {
  element: string; // e.g. "button.primary#submit"
  properties: CSSPropertyResult[];
  unreachableSheets: string[]; // cross-origin stylesheets that couldn't be read
}

// ── Specificity ────────────────────────────────────────────────────────

/**
 * Calculate CSS specificity for a selector string.
 *
 * Returns [ids, classes, elements] where:
 *   - ids:      count of #id selectors
 *   - classes:  count of .class, [attr], :pseudo-class (except :not, :is, :where, :has)
 *   - elements: count of element, ::pseudo-element
 *
 * This is a lightweight parser that handles the vast majority of real-world
 * selectors without pulling in a full CSS parser.
 */
export function calculateSpecificity(selector: string): SpecificityTuple {
  // Split compound selectors (comma-separated) — return max specificity.
  // splitOnCommas is depth-aware (parens, brackets, strings).
  const parts = splitOnCommas(selector);
  if (parts.length > 1) {
    let max: SpecificityTuple = [0, 0, 0];
    for (const part of parts) {
      const s = calculateSpecificity(part.trim());
      if (compareSpecificity(s, max) > 0) {
        max = s;
      }
    }
    return max;
  }

  let ids = 0;
  let classes = 0;
  let elements = 0;

  let s = selector.trim();

  // Extract :not(), :is(), :has(), :where() — depth-aware so nested pseudos work.
  // Process in reverse so removing each one doesn't shift earlier offsets.
  const pseudos = extractFunctionalPseudos(s);
  for (let i = pseudos.length - 1; i >= 0; i--) {
    const p = pseudos[i]!;
    if (p.name !== "where") {
      // :not(), :is(), :has() take the specificity of their argument.
      const inner = calculateSpecificity(p.arg);
      ids += inner[0];
      classes += inner[1];
      elements += inner[2];
    }
    // Remove this pseudo from the working selector — :where() contributes zero.
    s = s.slice(0, p.start) + s.slice(p.end);
  }

  // Replace string literals (attribute values) with placeholders so chars
  // inside them (like commas, brackets) don't get counted.
  s = stripStrings(s);

  // Replace bracketed attribute selectors with a single placeholder so the
  // contents (e.g. `[data-foo="a.b#c"]`) don't get counted as classes/IDs.
  // Each [..] block contributes one to the class column.
  let attrCount = 0;
  s = s.replace(/\[[^\]]*\]/g, () => {
    attrCount++;
    return " ";
  });
  classes += attrCount;

  // Count IDs: #foo
  const idMatches = s.match(/#[a-zA-Z_-][\w-]*/g);
  if (idMatches) ids += idMatches.length;

  // Count pseudo-elements: ::before, ::after, etc.
  const pseudoElementMatches = s.match(/::[a-zA-Z_-][\w-]*/g);
  if (pseudoElementMatches) elements += pseudoElementMatches.length;

  // Remove pseudo-elements so they don't interfere
  s = s.replace(/::[a-zA-Z_-][\w-]*/g, " ");

  // Remove IDs so they don't interfere with class counting
  s = s.replace(/#[a-zA-Z_-][\w-]*/g, " ");

  // Count classes: .foo
  const classMatches = s.match(/\.[a-zA-Z_-][\w-]*/g);
  if (classMatches) classes += classMatches.length;

  // Count pseudo-classes: :hover, :first-child, etc.
  const pseudoClassMatches = s.match(/:[a-zA-Z_-][\w-]*/g);
  if (pseudoClassMatches) classes += pseudoClassMatches.length;

  // Remove everything we've counted to isolate element selectors
  s = s.replace(/\.[a-zA-Z_-][\w-]*/g, " ");
  s = s.replace(/:[a-zA-Z_-][\w-]*/g, " ");

  // Count element selectors: div, span, etc. (not combinators or *)
  const elementMatches = s.match(/(?:^|[\s>+~])([a-zA-Z][\w-]*)/g);
  if (elementMatches) elements += elementMatches.length;

  return [ids, classes, elements];
}

/**
 * Find all `:not(...)`, `:is(...)`, `:has(...)`, `:where(...)` segments in a
 * selector with depth-aware parenthesis matching. Handles nested cases like
 * `:not(:is(.a, .b))` and string literals containing parens.
 */
function extractFunctionalPseudos(
  selector: string
): Array<{ name: string; arg: string; start: number; end: number }> {
  const result: Array<{ name: string; arg: string; start: number; end: number }> = [];
  const re = /:(not|is|has|where)\(/gi;
  let match: RegExpExecArray | null;

  while ((match = re.exec(selector)) !== null) {
    const name = match[1]!.toLowerCase();
    const start = match.index;
    const argStart = match.index + match[0].length;

    // Walk forward from argStart, tracking depth and string state, to find
    // the matching close paren.
    let depth = 1;
    let i = argStart;
    let inString: '"' | "'" | null = null;
    while (i < selector.length && depth > 0) {
      const ch = selector[i]!;
      if (inString) {
        if (ch === "\\") {
          i += 2;
          continue;
        }
        if (ch === inString) inString = null;
      } else if (ch === '"' || ch === "'") {
        inString = ch;
      } else if (ch === "(") {
        depth++;
      } else if (ch === ")") {
        depth--;
        if (depth === 0) break;
      }
      i++;
    }

    if (depth !== 0) {
      // Unmatched paren — bail out and return what we have
      break;
    }

    const arg = selector.slice(argStart, i);
    result.push({ name, arg, start, end: i + 1 });
    // Skip past the close paren so the regex doesn't recurse into nested pseudos
    re.lastIndex = i + 1;
  }

  return result;
}

/**
 * Replace string literal contents with spaces to neutralize embedded
 * special characters (commas, brackets, etc.) without changing offsets.
 */
function stripStrings(s: string): string {
  let out = "";
  let inString: '"' | "'" | null = null;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i]!;
    if (inString) {
      if (ch === "\\" && i + 1 < s.length) {
        out += "  ";
        i++;
        continue;
      }
      if (ch === inString) {
        inString = null;
        out += ch;
        continue;
      }
      out += " ";
    } else if (ch === '"' || ch === "'") {
      inString = ch;
      out += ch;
    } else {
      out += ch;
    }
  }
  return out;
}

/**
 * Compare two specificity tuples.
 * Returns positive if a > b, negative if a < b, 0 if equal.
 */
export function compareSpecificity(
  a: SpecificityTuple,
  b: SpecificityTuple
): number {
  if (a[0] !== b[0]) return a[0] - b[0];
  if (a[1] !== b[1]) return a[1] - b[1];
  return a[2] - b[2];
}

/**
 * Format specificity tuple as a human-readable string.
 */
export function formatSpecificity(s: SpecificityTuple): string {
  return `(${s[0]},${s[1]},${s[2]})`;
}

// ── Rule collection ────────────────────────────────────────────────────

/**
 * Describe the source of a stylesheet for display.
 */
function describeSource(sheet: CSSStyleSheet): string {
  if (sheet.href) {
    // For remote stylesheets, show just the filename
    try {
      const url = new URL(sheet.href);
      return url.pathname.split("/").pop() || sheet.href;
    } catch {
      return sheet.href;
    }
  }
  if (sheet.ownerNode instanceof HTMLStyleElement) {
    const id = sheet.ownerNode.id;
    if (id) return `<style#${id}>`;
    // Check for data attributes that might hint at CSS-in-JS
    const dataset = sheet.ownerNode.dataset;
    if (dataset.emotion) return `<style emotion="${dataset.emotion}">`;
    if (dataset.styledComponents) return `<style styled-components>`;
    return "<style>";
  }
  return "unknown";
}

/**
 * Describe an element for display: tagName.class1.class2#id
 */
export function describeElement(element: Element): string {
  let desc = element.tagName.toLowerCase();
  if (element.id) {
    desc += `#${element.id}`;
  }
  if (element.classList.length > 0) {
    desc += "." + Array.from(element.classList).join(".");
  }
  return desc;
}

/**
 * Compute the specificity of the branch(es) of a selector list that actually
 * match the element. `selectorText` may be comma-separated like
 * `.btn, #app` — `element.matches()` succeeds if any branch matches, but
 * specificity must come from the matching branch (not the max of all of them).
 */
function specificityForMatchingBranches(
  selectorText: string,
  element: Element
): SpecificityTuple {
  const branches = splitOnCommas(selectorText);
  let best: SpecificityTuple | null = null;

  for (const branch of branches) {
    const trimmed = branch.trim();
    if (!trimmed) continue;
    try {
      if (element.matches(trimmed)) {
        const spec = calculateSpecificity(trimmed);
        if (!best || compareSpecificity(spec, best) > 0) {
          best = spec;
        }
      }
    } catch {
      // Skip branches that error in matches() (rare invalid syntax)
    }
  }

  // Fallback: should be unreachable since the caller already verified
  // element.matches(selectorText), but stay safe.
  return best ?? calculateSpecificity(selectorText);
}

/**
 * Walk a list of CSS rules (handles @media, @supports, @layer nesting).
 * Mutates `results` and `nextIndex` (a counter object) so that every rule
 * gets a monotonically increasing source-order index.
 */
function walkRules(
  rules: CSSRuleList,
  element: Element,
  source: string,
  results: CSSRuleInfo[],
  nextIndex: { value: number }
): void {
  // Feature-detect the rule constructors so we don't crash in environments
  // (older jsdom, some embedded browsers) where they're undefined.
  const SupportsRuleCtor =
    typeof CSSSupportsRule !== "undefined" ? CSSSupportsRule : null;
  const MediaRuleCtor =
    typeof CSSMediaRule !== "undefined" ? CSSMediaRule : null;
  const StyleRuleCtor =
    typeof CSSStyleRule !== "undefined" ? CSSStyleRule : null;

  for (let i = 0; i < rules.length; i++) {
    const rule = rules[i]!;

    if (StyleRuleCtor && rule instanceof StyleRuleCtor) {
      // Check if the element matches this selector
      try {
        if (element.matches(rule.selectorText)) {
          // Use the specificity of the *matching branch*, not the whole list.
          const specificity = specificityForMatchingBranches(
            rule.selectorText,
            element
          );
          const style = rule.style;
          for (let j = 0; j < style.length; j++) {
            const property = style[j]!;
            const value = style.getPropertyValue(property);
            const important = style.getPropertyPriority(property) === "important";
            results.push({
              selector: rule.selectorText,
              property,
              value,
              specificity,
              important,
              source,
              sourceIndex: nextIndex.value++,
            });
          }
        }
      } catch {
        // Invalid selector — skip
      }
    } else if (MediaRuleCtor && rule instanceof MediaRuleCtor) {
      // Only recurse if the media query is currently active.
      const mq =
        typeof window !== "undefined" && typeof window.matchMedia === "function"
          ? window.matchMedia(rule.conditionText)
          : null;
      if (!mq || mq.matches) {
        walkRules(rule.cssRules, element, source, results, nextIndex);
      }
    } else if (SupportsRuleCtor && rule instanceof SupportsRuleCtor) {
      // The browser only lists @supports rules whose condition is met.
      walkRules(rule.cssRules, element, source, results, nextIndex);
    } else if ("cssRules" in rule && (rule as any).cssRules) {
      // Handle @layer and other grouping rules
      walkRules((rule as any).cssRules, element, source, results, nextIndex);
    }
  }
}

/**
 * Collect all CSS rules from all stylesheets that match the given element.
 * The shared `nextIndex` counter assigns each rule a monotonic source-order
 * index used as the cascade tie-breaker.
 */
function collectMatchingRules(
  element: Element,
  nextIndex: { value: number }
): { rules: CSSRuleInfo[]; unreachableSheets: string[] } {
  const rules: CSSRuleInfo[] = [];
  const unreachableSheets: string[] = [];

  for (let i = 0; i < document.styleSheets.length; i++) {
    const sheet = document.styleSheets[i]!;
    const source = describeSource(sheet);

    try {
      const cssRules = sheet.cssRules;
      walkRules(cssRules, element, source, rules, nextIndex);
    } catch {
      // Cross-origin stylesheet — can't read its rules
      unreachableSheets.push(source);
    }
  }

  return { rules, unreachableSheets };
}

/**
 * Collect inline styles from an element.
 */
function collectInlineStyles(
  element: Element,
  nextIndex: { value: number }
): CSSRuleInfo[] {
  if (!(element instanceof HTMLElement)) return [];
  const style = element.style;
  const rules: CSSRuleInfo[] = [];

  for (let i = 0; i < style.length; i++) {
    const property = style[i]!;
    const value = style.getPropertyValue(property);
    const important = style.getPropertyPriority(property) === "important";
    rules.push({
      selector: "element.style",
      property,
      value,
      specificity: [1, 0, 0] as SpecificityTuple, // inline = highest layer (treated as 1,0,0 for sorting)
      important,
      source: "inline",
      sourceIndex: nextIndex.value++,
    });
  }

  return rules;
}

// ── Main API ───────────────────────────────────────────────────────────

/**
 * Sort function for CSS rules: determines cascade winner. Sorts winners FIRST
 * (descending priority), so callers can take `sorted[0]` as the winning rule.
 *
 * Cascade order (highest priority first):
 * 1. !important beats non-important
 * 2. Inline style beats stylesheet rules (for same importance)
 * 3. Higher specificity beats lower
 * 4. Later source order beats earlier
 */
function cascadeCompare(a: CSSRuleInfo, b: CSSRuleInfo): number {
  // !important always wins
  if (a.important !== b.important) {
    return a.important ? -1 : 1;
  }
  // Inline styles win over stylesheet rules (unless !important reverses it)
  if ((a.source === "inline") !== (b.source === "inline")) {
    return a.source === "inline" ? -1 : 1;
  }
  // Higher specificity wins
  const specCmp = compareSpecificity(a.specificity, b.specificity);
  if (specCmp !== 0) return -specCmp; // negative because we want descending
  // Tie-breaker: later source order wins (higher index sorts first).
  return b.sourceIndex - a.sourceIndex;
}

/**
 * Inspect an element and return all CSS rules grouped by property,
 * showing which rule wins for each property.
 */
export function inspectCSSRules(element: Element): CSSInspectionResult {
  const nextIndex = { value: 0 };
  const { rules: sheetRules, unreachableSheets } = collectMatchingRules(
    element,
    nextIndex
  );
  const inlineRules = collectInlineStyles(element, nextIndex);
  const allRules = [...sheetRules, ...inlineRules];

  // Hoist getComputedStyle out of the per-property loop. May be null if the
  // element isn't in the document or in environments without a window.
  let computed: CSSStyleDeclaration | null = null;
  try {
    if (typeof window !== "undefined" && typeof window.getComputedStyle === "function") {
      computed = window.getComputedStyle(element);
    }
  } catch {
    computed = null;
  }

  // Group by property
  const byProperty = new Map<string, CSSRuleInfo[]>();
  for (const rule of allRules) {
    const existing = byProperty.get(rule.property);
    if (existing) {
      existing.push(rule);
    } else {
      byProperty.set(rule.property, [rule]);
    }
  }

  // For each property, sort by cascade priority and mark the winner
  const properties: CSSPropertyResult[] = [];
  for (const [property, rules] of byProperty) {
    // Sort: winner first
    const sorted = [...rules].sort(cascadeCompare);

    // Prefer the browser's computed value; fall back to the winning rule's value.
    let computedValue = sorted[0]?.value || "";
    const cv = computed?.getPropertyValue(property);
    if (cv) computedValue = cv;

    properties.push({
      property,
      value: computedValue,
      rules: sorted.map((rule, idx) => ({
        selector: rule.selector,
        value: rule.value,
        specificity: rule.specificity,
        important: rule.important,
        source: rule.source,
        winning: idx === 0,
      })),
    });
  }

  // Sort properties alphabetically for stable output
  properties.sort((a, b) => a.property.localeCompare(b.property));

  return {
    element: describeElement(element),
    properties,
    unreachableSheets,
  };
}

/**
 * Format CSS inspection result as a human-readable string for AI consumption.
 *
 * Example output:
 *
 *   CSS Rules for button.primary#submit
 *   ════════════════════════════════════
 *
 *   color: #333
 *     ✓ .button.primary  (0,2,0) — components.css
 *     ✗ .button          (0,1,0) — base.css
 *     ✗ button           (0,0,1) — reset.css
 *
 *   font-size: 14px
 *     ✓ element.style    (inline) — inline
 *     ✗ .button          (0,1,0) — base.css
 */
export function formatCSSInspection(result: CSSInspectionResult): string {
  const lines: string[] = [];

  const header = `CSS Rules for ${result.element}`;
  lines.push(header);
  lines.push("═".repeat(header.length));

  if (result.unreachableSheets.length > 0) {
    lines.push("");
    lines.push(
      `⚠ Cross-origin stylesheets (unreadable): ${result.unreachableSheets.join(", ")}`
    );
  }

  if (result.properties.length === 0) {
    lines.push("");
    lines.push("No matching CSS rules found.");
    return lines.join("\n");
  }

  for (const prop of result.properties) {
    lines.push("");
    lines.push(`${prop.property}: ${prop.value}`);

    for (const rule of prop.rules) {
      const mark = rule.winning ? "✓" : "✗";
      const imp = rule.important ? " !important" : "";
      const spec =
        rule.source === "inline"
          ? "(inline)"
          : formatSpecificity(rule.specificity);

      lines.push(
        `  ${mark} ${rule.selector}  ${spec}${imp} — ${rule.source}  ${
          !rule.winning ? `[${rule.value}]` : ""
        }`.trimEnd()
      );
    }
  }

  return lines.join("\n");
}

// ── Helpers ────────────────────────────────────────────────────────────

/**
 * Split a selector on top-level commas. Aware of:
 *   - parentheses (`:is(.a, .b)`)
 *   - brackets (`[data-value="a,b"]`)
 *   - string literals (`"a,b"`, `'a,b'`)
 *   - escape sequences (`\,`)
 */
function splitOnCommas(selector: string): string[] {
  const parts: string[] = [];
  let current = "";
  let parenDepth = 0;
  let bracketDepth = 0;
  let inString: '"' | "'" | null = null;
  let escapeNext = false;

  for (let i = 0; i < selector.length; i++) {
    const ch = selector[i]!;

    if (escapeNext) {
      current += ch;
      escapeNext = false;
      continue;
    }

    if (ch === "\\") {
      current += ch;
      escapeNext = true;
      continue;
    }

    if (inString) {
      current += ch;
      if (ch === inString) inString = null;
      continue;
    }

    if (ch === '"' || ch === "'") {
      inString = ch;
      current += ch;
      continue;
    }

    if (ch === "(") {
      parenDepth++;
      current += ch;
      continue;
    }

    if (ch === ")") {
      if (parenDepth > 0) parenDepth--;
      current += ch;
      continue;
    }

    if (ch === "[") {
      bracketDepth++;
      current += ch;
      continue;
    }

    if (ch === "]") {
      if (bracketDepth > 0) bracketDepth--;
      current += ch;
      continue;
    }

    if (ch === "," && parenDepth === 0 && bracketDepth === 0) {
      parts.push(current);
      current = "";
      continue;
    }

    current += ch;
  }

  parts.push(current);
  return parts;
}
