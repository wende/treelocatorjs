# TreeLocatorJS Chrome Extension (v1)

Headless MV3 extension for local-development pages. It injects TreeLocatorJS into the page context so Alt+click and tree-toggle workflows work without app code changes.

## Commands

```bash
# Build production extension
pnpm --filter @treelocator/extension build

# Watch/rebuild for local iteration
pnpm --filter @treelocator/extension dev

# Pack a Chrome ZIP from build/production_chrome
pnpm --filter @treelocator/extension pack:chrome
```

## Load Unpacked in Chrome

1. Build the extension.
2. Open `chrome://extensions`.
3. Enable **Developer mode**.
4. Click **Load unpacked**.
5. Select `apps/extension/build/production_chrome`.

## Scope

v1 only injects on local development hosts:

- `localhost`
- `127.0.0.1`
- `[::1]`
- `0.0.0.0`

on both HTTP and HTTPS.

## Output Layout

Build output is written to:

- `apps/extension/build/production_chrome/manifest.json`
- `apps/extension/build/production_chrome/contentScript.bundle.js`
- `apps/extension/build/production_chrome/hook.bundle.js`
- `apps/extension/build/production_chrome/client.bundle.js`
- `apps/extension/build/production_chrome/icons/*`
