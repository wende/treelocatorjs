import { AdapterId } from "./consts";
import { HELP_TEXT } from "./browserApiHelp";
import { createTreeNode } from "./adapters/createTreeNode";
import {
  collectAncestry,
  formatAncestryChain,
  getElementLabel,
  AncestryItem,
} from "./functions/formatAncestryChain";
import { enrichAncestryWithSourceMaps } from "./functions/enrichAncestrySourceMaps";
import {
  inspectCSSRules,
  formatCSSInspection,
  CSSInspectionResult,
} from "./functions/cssRuleInspector";
import {
  extractComputedStyles,
  ComputedStylesResult,
  ExtractOptions,
} from "./functions/extractComputedStyles";
import {
  takeNamedSnapshot,
  getNamedSnapshotDiff,
  clearNamedSnapshot,
  TakeSnapshotResult,
  SnapshotDiffResult,
} from "./functions/namedSnapshots";
import type { RecordingResult } from "./hooks/useRecordingState";
import { takeSnapshot } from "./visualDiff/snapshot";
import { computeDiff, formatReport } from "./visualDiff/diff";
import { waitForSettle } from "./visualDiff/settle";
import type { DeltaReport, ElementSnapshot } from "./visualDiff/types";

export interface LocatorJSAPI {
  /**
   * Get formatted ancestry path for an element.
   * Returns a human-readable string showing the component hierarchy from root to target element.
   *
   * @param elementOrSelector - HTMLElement or CSS selector string (e.g., 'button.submit', '#login-form')
   * @returns Formatted ancestry chain as string, or null if element not found/unsupported
   *
   * @example
   * // Basic usage with CSS selector
   * window.__treelocator__.getPath('button.submit');
   * // Returns:
   * // "div in App at src/App.tsx:15
   * //  └─ button in SubmitButton at src/components/SubmitButton.tsx:12"
   *
   * @example
   * // Usage with HTMLElement
   * const button = document.querySelector('button.submit');
   * window.__treelocator__.getPath(button);
   *
   * @example
   * // In Playwright
   * const path = await page.evaluate(() => {
   *   return window.__treelocator__.getPath('button.submit');
   * });
   * console.log(path);
   */
  getPath(elementOrSelector: HTMLElement | string): Promise<string | null>;

  /**
   * Get raw ancestry data for an element.
   * Returns an array of objects containing component names, file paths, and line numbers.
   *
   * @param elementOrSelector - HTMLElement or CSS selector string
   * @returns Array of ancestry items with structure:
   *   - elementName: HTML element tag (e.g., 'div', 'button')
   *   - componentName: Component name (e.g., 'LoginButton')
   *   - filePath: Source file path (e.g., 'src/components/LoginButton.tsx')
   *   - line: Line number in source file
   *
   * @example
   * // Get structured ancestry data
   * const ancestry = window.__treelocator__.getAncestry('button.submit');
   * // Returns: [
   * //   { elementName: 'div', componentName: 'App', filePath: 'src/App.tsx', line: 15 },
   * //   { elementName: 'button', componentName: 'SubmitButton', filePath: 'src/components/SubmitButton.tsx', line: 12 }
   * // ]
   *
   * @example
   * // In Playwright - extract just component names
   * const components = await page.evaluate(() => {
   *   const ancestry = window.__treelocator__.getAncestry('.my-element');
   *   return ancestry?.map(item => item.componentName).filter(Boolean);
   * });
   */
  getAncestry(elementOrSelector: HTMLElement | string): Promise<AncestryItem[] | null>;

  /**
   * Get both formatted path and raw ancestry data in a single call.
   * Convenience method that combines getPath() and getAncestry().
   *
   * @param elementOrSelector - HTMLElement or CSS selector string
   * @returns Object with { path: string, ancestry: AncestryItem[] }, or null
   *
   * @example
   * // Get both formats at once
   * const data = window.__treelocator__.getPathData('button.submit');
   * console.log(data.path);      // Human-readable string
   * console.log(data.ancestry);  // Structured array
   *
   * @example
   * // In Playwright - useful for comprehensive debugging
   * const data = await page.evaluate(() => {
   *   return window.__treelocator__.getPathData('.error-message');
   * });
   * if (data) {
   *   console.log('Component tree:', data.path);
   *   console.log('Source files:', data.ancestry.map(a => a.filePath));
   * }
   */
  getPathData(
    elementOrSelector: HTMLElement | string
  ): Promise<{ path: string; ancestry: AncestryItem[] } | null>;

  /**
   * Get computed styles for an element, formatted for AI consumption.
   * Extracts layout, visual, typography, and interaction styles filtered against browser defaults.
   * Clicking the same element twice within 30s returns a diff of changed properties.
   *
   * @param elementOrSelector - HTMLElement or CSS selector string
   * @param options - Optional flags like { includeDefaults: true } for a fuller dump
   * @returns Object with formatted string and raw snapshot, or null if element not found
   *
   * @example
   * // Get formatted computed styles
   * const result = window.__treelocator__.getStyles('button.submit');
   * console.log(result.formatted);
   * // [ComputedStyles] Button at src/Button.tsx:23
   * // ─────────────────────────────────────────
   * // Layout
   * //   display: flex
   * //   padding: 8px 16px
   * // ...
   *
   * @example
   * // In Playwright
   * const styles = await page.evaluate(() => {
   *   return window.__treelocator__.getStyles('.my-element', {
   *     includeDefaults: true,
   *   });
   * });
   * console.log(styles?.formatted);
   */
  getStyles(
    elementOrSelector: HTMLElement | string,
    options?: ExtractOptions
  ): ComputedStylesResult | null;

  /**
   * Display help information about the LocatorJS API.
   * Shows usage examples and method descriptions for browser automation tools.
   *
   * @returns Help text as a string
   *
   * @example
   * // View help in browser console
   * console.log(window.__treelocator__.help());
   *
   * @example
   * // In Playwright - view help
   * const help = await page.evaluate(() => window.__treelocator__.help());
   * console.log(help);
   */
  help(): string;

  /**
   * Inspect all CSS rules matching an element, grouped by property.
   * Shows which rule wins for each property with specificity, source, and !important info.
   * Returns structured data for programmatic use.
   *
   * @param elementOrSelector - HTMLElement or CSS selector string
   * @returns Structured CSS inspection result, or null if element not found
   *
   * @example
   * // Get structured CSS data
   * const result = window.__treelocator__.getCSSRules('button.primary');
   * result.properties.forEach(p => {
   *   console.log(`${p.property}: ${p.value}`);
   *   p.rules.forEach(r => console.log(`  ${r.winning ? '✓' : '✗'} ${r.selector}`));
   * });
   *
   * @example
   * // In Playwright - debug why a style isn't applying
   * const css = await page.evaluate(() =>
   *   window.__treelocator__.getCSSRules('.my-button')
   * );
   * const colorRules = css?.properties.find(p => p.property === 'color');
   * console.log(colorRules);
   */
  getCSSRules(
    elementOrSelector: HTMLElement | string
  ): CSSInspectionResult | null;

  /**
   * Get a formatted human-readable report of all CSS rules matching an element.
   * Shows winning/losing rules per property with specificity and source info.
   * Ideal for pasting into AI chat or logging.
   *
   * @param elementOrSelector - HTMLElement or CSS selector string
   * @param options - Optional filter: { properties?: string[] } to limit output to specific properties
   * @returns Formatted string report, or null if element not found
   *
   * @example
   * // Get full CSS report
   * console.log(window.__treelocator__.getCSSReport('button.primary'));
   * // Output:
   * // CSS Rules for button.primary
   * // ════════════════════════════
   * //
   * // color: #333
   * //   ✓ .button.primary  (0,2,0) — components.css
   * //   ✗ .button          (0,1,0) — base.css
   * //   ✗ button           (0,0,1) — reset.css
   *
   * @example
   * // Filter to specific properties
   * console.log(window.__treelocator__.getCSSReport('.card', { properties: ['color', 'background'] }));
   *
   * @example
   * // In Playwright
   * const report = await page.evaluate(() =>
   *   window.__treelocator__.getCSSReport('.error-message')
   * );
   * console.log(report);
   */
  getCSSReport(
    elementOrSelector: HTMLElement | string,
    options?: { properties?: string[] }
  ): string | null;

  /**
   * Capture a baseline snapshot of an element's computed styles and persist
   * it in localStorage under `snapshotId`. The baseline survives page reloads
   * and is never mutated until you call `takeSnapshot` again with the same id.
   *
   * @param selector - CSS selector for the element to snapshot
   * @param snapshotId - caller-chosen id used to retrieve the diff later
   * @param options - optional `{ index, label }` (index picks among matches)
   */
  takeSnapshot(
    selector: string,
    snapshotId: string,
    options?: { index?: number; label?: string }
  ): TakeSnapshotResult;

  /**
   * Diff the current computed styles of the element against the baseline
   * stored under `snapshotId`. Does not overwrite the baseline — safe to call
   * repeatedly while iterating on a change.
   */
  getSnapshotDiff(snapshotId: string): SnapshotDiffResult;

  /**
   * Remove a stored baseline snapshot.
   */
  clearSnapshot(snapshotId: string): void;

  /**
   * Replay the last recorded interaction sequence.
   * Dispatches the recorded clicks at the original positions and timing.
   * Must have a completed recording with interactions to replay.
   *
   * @example
   * // In browser console
   * window.__treelocator__.replay();
   *
   * @example
   * // In Playwright
   * await page.evaluate(() => window.__treelocator__.replay());
   */
  replay(): void;

  /**
   * Replay the last recorded interaction sequence while recording an element's property changes.
   * Combines replay and dejitter recording: plays back stored clicks at original timing while
   * tracking visual changes (opacity, transform, position, size) on the target element.
   * Returns the dejitter analysis results when replay completes.
   *
   * @param elementOrSelector - HTMLElement or CSS selector for the element to record during replay
   * @returns Promise resolving to recording results with findings, summary, and interaction log
   *
   * @example
   * // Record the sliding panel while replaying user clicks
   * const results = await window.__treelocator__.replayWithRecord('[data-locatorjs-id="SlidingPanel"]');
   * console.log(results.findings); // anomaly analysis
   * console.log(results.path);     // component ancestry
   *
   * @example
   * // In Playwright - automated regression test
   * const results = await page.evaluate(async () => {
   *   return await window.__treelocator__.replayWithRecord('.my-panel');
   * });
   * expect(results.findings.filter(f => f.severity === 'high')).toHaveLength(0);
   */
  replayWithRecord(
    elementOrSelector: HTMLElement | string
  ): Promise<RecordingResult | null>;

  /**
   * Visual diff engine — snapshot page state before/after an action and return
   * a compact delta report.
   *
   * @example
   * // In browser console or Playwright
   * const report = await window.__treelocator__.diff.captureDiff(() => {
   *   document.querySelector('button.submit')?.click();
   * });
   * console.log(report.text);
   */
  diff: {
    /**
     * Capture a snapshot of all visible viewport elements right now.
     * Pure — no side effects on the page.
     */
    snapshot(): ElementSnapshot[];

    /**
     * Compute the delta between two snapshots.
     */
    computeDiff(
      before: ElementSnapshot[],
      after: ElementSnapshot[]
    ): DeltaReport;

    /**
     * Take a before-snapshot, run the action, wait for the page to settle
     * (animations idle + mutations silent for 150ms), take an after-snapshot,
     * and return the computed delta.
     */
    captureDiff(
      action: () => void | Promise<void>,
      opts?: { settleTimeoutMs?: number }
    ): Promise<DeltaReport>;
  };
}

function resolveElement(
  elementOrSelector: HTMLElement | string
): HTMLElement | null {
  if (typeof elementOrSelector === "string") {
    // querySelector throws DOMException for invalid selector strings
    // (e.g. "!!!") — return null instead of crashing the API call.
    let element: Element | null = null;
    try {
      element = document.querySelector(elementOrSelector);
    } catch {
      return null;
    }
    return element instanceof HTMLElement ? element : null;
  }
  return elementOrSelector;
}

/**
 * The browser API is consumed by automation tools and host pages that can't
 * recover from exceptions thrown deep inside adapter internals. Query methods
 * are documented to return null on failure, so guard them and honor that
 * contract even for unexpected errors. (Snapshot methods are excluded: they
 * throw typed NamedSnapshotErrors as their documented error channel.)
 */
function safeSync<T>(methodName: string, fallback: T, fn: () => T): T {
  try {
    return fn();
  } catch (error) {
    console.warn(`[treelocator] ${methodName} failed:`, error);
    return fallback;
  }
}

async function safeAsync<T>(
  methodName: string,
  fallback: T,
  fn: () => Promise<T>
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    console.warn(`[treelocator] ${methodName} failed:`, error);
    return fallback;
  }
}

export function createBrowserAPI(adapterId?: AdapterId): LocatorJSAPI {
  function getAncestry(element: HTMLElement): AncestryItem[] | null {
    const treeNode = createTreeNode(element, adapterId);
    return treeNode ? collectAncestry(treeNode) : null;
  }

  async function getEnrichedAncestry(
    elementOrSelector: HTMLElement | string
  ): Promise<AncestryItem[] | null> {
    const element = resolveElement(elementOrSelector);
    if (!element) return null;
    const ancestry = getAncestry(element);
    if (!ancestry) return null;
    return enrichAncestryWithSourceMaps(ancestry, element);
  }

  return {
    getPath(elementOrSelector) {
      return safeAsync("getPath", null, async () => {
        const ancestry = await getEnrichedAncestry(elementOrSelector);
        return ancestry ? formatAncestryChain(ancestry) : null;
      });
    },

    getAncestry(elementOrSelector) {
      return safeAsync("getAncestry", null, () =>
        getEnrichedAncestry(elementOrSelector)
      );
    },

    getPathData(elementOrSelector) {
      return safeAsync("getPathData", null, async () => {
        const ancestry = await getEnrichedAncestry(elementOrSelector);
        return ancestry
          ? { path: formatAncestryChain(ancestry), ancestry }
          : null;
      });
    },

    getStyles(elementOrSelector, options?: ExtractOptions) {
      return safeSync("getStyles", null, () => {
        const element = resolveElement(elementOrSelector);
        if (!element) return null;
        const ancestry = getAncestry(element);
        const label = ancestry ? getElementLabel(ancestry) : undefined;
        return extractComputedStyles(element, label || undefined, options);
      });
    },

    getCSSRules(elementOrSelector) {
      return safeSync("getCSSRules", null, () => {
        const element = resolveElement(elementOrSelector);
        return element ? inspectCSSRules(element) : null;
      });
    },

    getCSSReport(elementOrSelector, options?: { properties?: string[] }) {
      return safeSync("getCSSReport", null, () => {
        const element = resolveElement(elementOrSelector);
        if (!element) return null;
        const result = inspectCSSRules(element);

        if (options?.properties && options.properties.length > 0) {
          const filterSet = new Set(
            options.properties.map((p) => p.toLowerCase())
          );
          result.properties = result.properties.filter((p) =>
            filterSet.has(p.property.toLowerCase())
          );
        }

        return formatCSSInspection(result);
      });
    },

    takeSnapshot(selector, snapshotId, options) {
      return takeNamedSnapshot(selector, snapshotId, options);
    },

    getSnapshotDiff(snapshotId) {
      return getNamedSnapshotDiff(snapshotId);
    },

    clearSnapshot(snapshotId) {
      clearNamedSnapshot(snapshotId);
    },

    help() {
      return HELP_TEXT;
    },

    replay() {
      // Replaced by Runtime component once mounted
    },

    replayWithRecord() {
      // Replaced by Runtime component once mounted
      return Promise.resolve(null);
    },

    diff: {
      snapshot() {
        return takeSnapshot();
      },
      computeDiff(before, after) {
        return computeDiff(before, after);
      },
      async captureDiff(action, opts) {
        const started = performance.now();
        const before = takeSnapshot();
        await action();
        const settle = await waitForSettle(opts?.settleTimeoutMs);
        const after = takeSnapshot();
        const report = computeDiff(before, after);
        report.elapsedMs = performance.now() - started;
        report.settle = settle;
        report.text = formatReport(report.entries, {
          elapsedMs: report.elapsedMs,
          settle,
        });
        return report;
      },
    },
  };
}

export function installBrowserAPI(adapterIdParam?: AdapterId): void {
  if (typeof window !== "undefined") {
    (window as any).__treelocator__ = createBrowserAPI(adapterIdParam);
  }
}
