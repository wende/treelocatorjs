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
  // Split compound selectors (comma-separated) — return max specificity
  // Only split on top-level commas (not inside :is(), :not(), etc.)
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

  // Work on a clean copy
  let s = selector.trim();

  // Remove :not(), :is(), :has() wrappers but keep their contents
  // (their specificity comes from their arguments, not the pseudo-class itself)
  // :where() has zero specificity — remove it entirely
  s = s.replace(/:where\([^)]*\)/g, "");

  // Handle :not(), :is(), :has() — extract argument and count its specificity
  const functionalPseudoRe = /:(not|is|has)\(([^)]*)\)/g;
  let match: RegExpExecArray | null;
  while ((match = functionalPseudoRe.exec(s)) !== null) {
    const inner = calculateSpecificity(match[2]!);
    ids += inner[0];
    classes += inner[1];
    elements += inner[2];
  }
  // Remove the functional pseudo-classes we already counted
  s = s.replace(/:(not|is|has)\([^)]*\)/g, "");

  // Remove strings (attribute values) to avoid false matches
  s = s.replace(/"[^"]*"/g, "").replace(/'[^']*'/g, "");

  // Count IDs: #foo
  const idMatches = s.match(/#[a-zA-Z_-][\w-]*/g);
  if (idMatches) ids += idMatches.length;

  // Count pseudo-elements: ::before, ::after, etc.
  const pseudoElementMatches = s.match(/::[a-zA-Z_-][\w-]*/g);
  if (pseudoElementMatches) elements += pseudoElementMatches.length;

  // Remove pseudo-elements so they don't interfere
  s = s.replace(/::[a-zA-Z_-][\w-]*/g, "");

  // Remove IDs so they don't interfere with class counting
  s = s.replace(/#[a-zA-Z_-][\w-]*/g, "");

  // Count classes: .foo
  const classMatches = s.match(/\.[a-zA-Z_-][\w-]*/g);
  if (classMatches) classes += classMatches.length;

  // Count attribute selectors: [attr], [attr=val], etc.
  const attrMatches = s.match(/\[[^\]]*\]/g);
  if (attrMatches) classes += attrMatches.length;

  // Count pseudo-classes: :hover, :first-child, etc.
  const pseudoClassMatches = s.match(/:[a-zA-Z_-][\w-]*/g);
  if (pseudoClassMatches) classes += pseudoClassMatches.length;

  // Remove everything we've counted to isolate element selectors
  s = s.replace(/\.[a-zA-Z_-][\w-]*/g, "");
  s = s.replace(/\[[^\]]*\]/g, "");
  s = s.replace(/:[a-zA-Z_-][\w-]*/g, "");

  // Count element selectors: div, span, etc. (not combinators or *)
  const elementMatches = s.match(/(?:^|[\s>+~])([a-zA-Z][\w-]*)/g);
  if (elementMatches) elements += elementMatches.length;

  return [ids, classes, elements];
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
 * Walk a list of CSS rules (handles @media, @supports, @layer nesting).
 */
function walkRules(
  rules: CSSRuleList,
  element: Element,
  source: string,
  results: CSSRuleInfo[]
): void {
  for (let i = 0; i < rules.length; i++) {
    const rule = rules[i]!;

    if (rule instanceof CSSStyleRule) {
      // Check if the element matches this selector
      try {
        if (element.matches(rule.selectorText)) {
          const specificity = calculateSpecificity(rule.selectorText);
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
            });
          }
        }
      } catch {
        // Invalid selector — skip
      }
    } else if (
      rule instanceof CSSMediaRule ||
      rule instanceof CSSSupportsRule
    ) {
      // Recurse into nested rules (only if the condition is active)
      if (rule instanceof CSSMediaRule) {
        if (typeof window !== "undefined" && window.matchMedia(rule.conditionText).matches) {
          walkRules(rule.cssRules, element, source, results);
        }
      } else {
        // CSSSupportsRule — the browser only lists it if the condition is met
        walkRules(rule.cssRules, element, source, results);
      }
    } else if ("cssRules" in rule && (rule as any).cssRules) {
      // Handle @layer and other grouping rules
      walkRules((rule as any).cssRules, element, source, results);
    }
  }
}

/**
 * Collect all CSS rules from all stylesheets that match the given element.
 */
function collectMatchingRules(
  element: Element
): { rules: CSSRuleInfo[]; unreachableSheets: string[] } {
  const rules: CSSRuleInfo[] = [];
  const unreachableSheets: string[] = [];

  for (let i = 0; i < document.styleSheets.length; i++) {
    const sheet = document.styleSheets[i]!;
    const source = describeSource(sheet);

    try {
      const cssRules = sheet.cssRules;
      walkRules(cssRules, element, source, rules);
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
function collectInlineStyles(element: Element): CSSRuleInfo[] {
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
    });
  }

  return rules;
}

// ── Main API ───────────────────────────────────────────────────────────

/**
 * Sort function for CSS rules: determines cascade winner.
 *
 * Order (highest priority first):
 * 1. !important beats non-important
 * 2. Inline style beats stylesheet rules (for same importance)
 * 3. Higher specificity beats lower
 * 4. Later source order beats earlier (implicit from iteration order)
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
  // Later in source order wins (higher index = later = higher priority)
  return 0; // maintain original order (later rules come later in the array)
}

/**
 * Inspect an element and return all CSS rules grouped by property,
 * showing which rule wins for each property.
 */
export function inspectCSSRules(element: Element): CSSInspectionResult {
  const { rules: sheetRules, unreachableSheets } = collectMatchingRules(element);
  const inlineRules = collectInlineStyles(element);
  const allRules = [...sheetRules, ...inlineRules];

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

    // Get the actual computed value from the browser
    let computedValue = sorted[0]?.value || "";
    try {
      const computed = window.getComputedStyle(element);
      const cv = computed.getPropertyValue(property);
      if (cv) computedValue = cv;
    } catch {
      // use the winning rule's value as fallback
    }

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
 * Split a selector on top-level commas (not inside parens).
 */
function splitOnCommas(selector: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = "";
  for (const ch of selector) {
    if (ch === "(") depth++;
    else if (ch === ")") depth--;
    else if (ch === "," && depth === 0) {
      parts.push(current);
      current = "";
      continue;
    }
    current += ch;
  }
  parts.push(current);
  return parts;
}
