# TreeLocatorJS Chrome Extension Release Checklist

## 1) Build and Package

```bash
pnpm --filter @treelocator/extension build
pnpm --filter @treelocator/extension pack:chrome
```

Verify:

- `apps/extension/build/production_chrome/manifest.json` exists at ZIP root.
- ZIP file: `apps/extension/build/treelocatorjs-chrome.zip`.

## 2) Local Validation

- Load unpacked extension from `apps/extension/build/production_chrome`.
- Validate on local React and Svelte demo apps.
- Confirm:
  - Alt+click copies ancestry.
  - Tree toggle works.
  - `window.__treelocator__` API is present.
- Confirm extension does not inject on non-localhost pages.

## 3) Chrome Web Store Account Prep

- Developer account registered.
- One-time registration fee paid.
- 2-step verification enabled.
- Verified contact email configured.

## 4) Store Listing Content

- Name: **TreeLocatorJS**
- Long description focused on single purpose.
- Upload assets from `apps/extension/store-assets/` (replace placeholders first):
  - 128x128 icon
  - >=1 screenshot (1280x800)
  - 440x280 small promo tile
  - 1400x560 marquee promo tile

## 5) Privacy Tab

- Single purpose statement completed.
- Permission justifications completed (local dev host access only).
- Remote code declaration completed and accurate.
- Data-use certification completed.
- Privacy policy URL provided.

## 6) Publish Strategy

- Upload ZIP as **Unlisted**.
- Use staged/manual publish (do not auto-publish).
- Share beta link with testers.
- Promote to Public only after beta stability.
