/* eslint-disable no-console */
/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-var-requires */

// Rewrites the `setStyleProperty` import emitted by babel-preset-solid
// to an inline polyfill, so dist files do not depend on `solid-js/web`
// exporting `setStyleProperty` (it is missing from the `node` / SSR bundle
// that Next.js 16 + webpack resolve against).
//
// babel-preset-solid emits this exact line in any file with non-foldable
// style props:
//   import { setStyleProperty as _$setStyleProperty } from "solid-js/web";
// We replace it with a local polyfill definition that calls the DOM API
// directly. The call sites (_$setStyleProperty(el, name, value)) are
// already correct — they just need a valid binding.

const fs = require("fs-extra");
const path = require("path");

const COMPONENTS_DIR = path.join(__dirname, "..", "dist", "components");

const BAD_IMPORT =
  /import\s*\{\s*setStyleProperty\s+as\s+_\$setStyleProperty\s*\}\s*from\s*["']solid-js\/web["']\s*;?/g;

const POLYFILL =
  'var _$setStyleProperty = (el, name, value) => el.style.setProperty(name, value);';

async function rewriteFile(filePath) {
  const original = await fs.readFile(filePath, "utf-8");
  if (!BAD_IMPORT.test(original)) return false;
  BAD_IMPORT.lastIndex = 0;
  const rewritten = original.replace(BAD_IMPORT, POLYFILL);
  if (rewritten === original) return false;
  await fs.writeFile(filePath, rewritten, "utf-8");
  return true;
}

async function run() {
  if (!(await fs.pathExists(COMPONENTS_DIR))) {
    console.log("[polyfill] no dist/components/ — skipping");
    return;
  }
  const entries = await fs.readdir(COMPONENTS_DIR);
  let changed = 0;
  for (const name of entries) {
    if (!name.endsWith(".js")) continue;
    const full = path.join(COMPONENTS_DIR, name);
    if (await rewriteFile(full)) {
      console.log(`[polyfill] rewrote ${name}`);
      changed++;
    }
  }
  console.log(`[polyfill] done — ${changed} file(s) updated`);
}

if (process.env.WATCH) {
  fs.watch(COMPONENTS_DIR, { recursive: false }, () => {
    run().catch((e) => console.error(e));
  });
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});