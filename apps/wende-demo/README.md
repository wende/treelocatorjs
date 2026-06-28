# TreeLocatorJS Demo

Interactive demo for [TreeLocatorJS](https://github.com/wende/treelocatorjs): Alt+click component discovery, dejitter recording, and anomaly detection.

## Local development

From the monorepo root:

```bash
pnpm install
pnpm dev --filter wende-demo
```

## Deploy to Vercel

Set the Vercel project root directory to `apps/wende-demo`. The included `vercel.json` runs install and build from the monorepo root so workspace packages resolve correctly.

```bash
cd apps/wende-demo
vercel deploy -y
```

## Demo flow

1. **Intro** — guided walkthrough: activate the tree icon, pick an element, copy ancestry.
2. **Explore more** — always-visible button opens the anomaly playground with jitter, jump, flicker, and layout-shift elements. Use the record button on the tree pill to capture and analyze them.
