# Dev Notes: Computed Styles Extraction, CSS Rule Inspector & Runtime Refactoring

**Date:** April 10-11, 2026

## Summary

Two major features landed in the runtime this week:
1. **CSS Rule Inspector** - Debug CSS specificity conflicts by extracting matched CSS rules
2. **Computed Styles Extraction** - Capture computed styles on Alt+click for debugging

Additionally, a major refactoring of the runtime extracted recording hooks and migrated tests from Jest to Vitest.

---

## 1. CSS Rule Inspector (PR #1)

**Commit:** `ae5996a` → `f1c98fa` (merged)

### What it does
When Alt+clicking an element, the runtime now extracts all CSS rules that match the element, including:
- Selector specificity scores
- Rule source (file:line:column when available)
- Whether the rule is from inline styles, `<style>` tags, or external stylesheets
- Cross-browser compatible rule parsing

### Key files added/modified
- `packages/runtime/src/functions/cssRuleInspector.ts` (468 lines) - Core rule extraction logic
- `packages/runtime/src/functions/cssRuleInspector.test.ts` (268 lines) - Comprehensive tests
- `packages/runtime/src/browserApi.ts` - Added `getCSSRules()` to browser API

### Technical challenges
- **Cross-browser compatibility**: Firefox and Chrome handle `CSSStyleRule` differently
- **Specificity calculation**: Implemented CSS specificity algorithm (a,b,c scoring)
- **Source mapping**: Extract source locations from CSSOM when browsers provide them

### PR review feedback addressed
- Replaced `innerHTML` with `createElement` in tests for security
- Fixed per-line eslint-disable comments
- Added proper error handling for cross-origin stylesheets

---

## 2. Computed Styles Extraction (PR #2)

**Commit:** `7ebfe72` → `fc43e97` (merged)

### What it does
Extracts computed styles from clicked elements, useful for debugging styling issues:
- Captures all computed CSS properties (not just declared ones)
- Filters to user-relevant properties (removes internal browser properties)
- Groups by property category (layout, typography, colors, etc.)
- Accessible via `window.__treelocator__.getComputedStyles()`

### Key files added/modified
- `packages/runtime/src/functions/extractComputedStyles.ts` (720 lines) - Style extraction engine
- `packages/runtime/src/functions/extractComputedStyles.test.ts` (573 lines) - Tests
- `packages/runtime/src/browserApi.ts` - Added `getComputedStyles()` method
- `packages/runtime/src/functions/formatAncestryChain.ts` - Includes styles in formatted output

### Technical details
- Uses `window.getComputedStyle()` API
- Filters ~250+ internal browser properties to ~50 relevant ones
- Categorizes properties for easier reading
- Handles pseudo-elements (`::before`, `::after`)

---

## 3. Runtime Refactoring: Recording Hooks Extraction (PR #3 base)

**Commit:** `48fc934` (main)

### What changed
Major refactoring of the monolithic `Runtime.tsx` component:
- Extracted recording logic into dedicated hooks
- Migrated test suite from Jest to Vitest
- Added comprehensive test coverage

### New hooks
- `useRecordingState.ts` (445 lines) - Manages recording state machine
- `useEventListeners.ts` (97 lines) - Centralized event handling
- `useLocatorStorage.ts` (48 lines) - LocalStorage management

### New tests added
- `detectFramework.test.ts` - Framework auto-detection
- `jsxAdapter.test.ts` - JSX adapter functionality
- `parseNextjsDataAttributes.test.ts` - Next.js integration
- `svelteAdapter.test.ts` - Svelte adapter
- `vueAdapter.test.ts` - Vue adapter
- `browserApi.test.ts` - Browser API surface
- `deduplicateLabels.test.ts` - Label deduplication
- `getUsableName.test.ts` - Name resolution
- `isCombinationModifiersPressed.test.ts` - Keyboard shortcuts
- `normalizeFilePath.test.ts` - Path normalization
- `parseDataId.test.ts` - Data attribute parsing
- `useLocatorStorage.test.ts` - Storage hook

### Migration: Jest → Vitest
- Removed `jest.config.ts` (195 lines)
- Added `vitest.config.ts` with SolidJS support
- Updated all test files to use Vitest imports
- Tests now run faster with better watch mode

---

## 4. CI/CD Improvements

**Commit:** `c04164c` → `a48a308` (merged)

### Auto Codex Review
New GitHub workflow (`.github/workflows/codex-review.yml`) that:
- Triggers on PR open
- Automatically requests Codex AI review
- Helps catch issues before human review

### Lint fixes
- Fixed pre-existing ESLint errors that were blocking CI
- Added `.eslintignore` for generated files
- Updated `eslint-solid-preset.js` and `eslint-base-preset.js`

---

## 5. Bug Fixes

### Babel plugin path correction
**Commits:** `5b8a873`, `a45b8c1`
- Fixed incorrect babel-jsx package name in install pages
- Corrected plugin path from `@treelocator/babel-jsx` to `@locator/babel-jsx`
- Updated `apps/web/babel.config.js`

---

## Browser API Changes

Both new features are exposed via `window.__treelocator__`:

```typescript
// Get CSS rules for an element
const rules = window.__treelocator__.getCSSRules('.my-class');

// Get computed styles
const styles = window.__treelocator__.getComputedStyles(element);

// Both are also included in the full ancestry data
const ancestry = window.__treelocator__.getAncestry(element);
// ancestry.cssRules - matched CSS rules
// ancestry.computedStyles - computed styles
```

---

## Stats

- **~3,800 lines added** in new features and tests
- **~1,100 lines removed** (Jest config, old code)
- **15+ new test files** with comprehensive coverage
- **3 PRs merged** to main

---

## Next Steps

- Monitor for any edge cases with cross-origin stylesheets
- Consider adding visual diff for computed styles between breakpoints
- Document new browser API methods in BROWSER-API.md
