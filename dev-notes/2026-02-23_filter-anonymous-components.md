# Filter Anonymous Components from Ancestry Chain

**Date**: 2026-02-23
**Files changed**: `getUsableName.ts`, `formatAncestryChain.ts`, `formatAncestryChain.test.ts`

## Problem

Next.js App Router wraps page components in anonymous internal wrappers (arrow functions without names). These show up as "Anonymous" in the treelocator ancestry path:

```
Home:nth-child(2) in Anonymous
    └─ Home:nth-child(1)
        └─ main
```

The `in Anonymous` adds no useful context and is confusing.

## Root Cause

Two gaps in how component names are resolved and displayed:

1. **`getUsableName.ts`** only checked `fiber.elementType.name`, `.displayName`, `.type.name`, and `._payload._result.name`. It missed names available via `forwardRef` (`.render.name`), `displayName` on nested types (`.type.displayName`, `.render.displayName`), lazy component display names, and `fiber.type` (which can differ from `elementType` in some React internals).

2. **`formatAncestryChain.ts`** used raw component names from the owner chain without filtering. If a framework wrapper resolved to "Anonymous" despite the improved name resolution (genuinely nameless components), it still appeared in the `in X > Y` suffix and affected component boundary detection.

## Fix

### `getUsableName.ts` — More fallback paths

Added checks for:
- `fiber.elementType.type.displayName` (memo wrapping component with displayName)
- `fiber.elementType.render.name` / `.displayName` (forwardRef components)
- `fiber.elementType._payload._result.displayName` (lazy components)
- `fiber.type.name` / `.displayName` (when `fiber.type !== fiber.elementType`)

### `formatAncestryChain.ts` — Filter "Anonymous" from display

Three changes:

1. **Helper `getInnermostNamedComponent()`**: Resolves the innermost non-Anonymous component name from an `AncestryItem`. Used for component boundary detection so "Anonymous" doesn't create false boundaries.

2. **Owner chain filtering**: When building the display name and `outerComponents` list, filters out entries with `name === "Anonymous"`. If all owners are anonymous, falls back to the raw element name.

3. **`componentName` fallback**: When an item has `componentName: "Anonymous"` without `ownerComponents`, it's not used as a display name.

## Tests Added

5 new test cases in `formatAncestryChain.test.ts`:
- Filters Anonymous from outer components in "in X > Y" display
- Filters Anonymous from component boundary detection
- Handles all-Anonymous owner chain gracefully (falls back to element name)
- Skips Anonymous-only componentName without ownerComponents
- Preserves named components when mixed with Anonymous in the chain
