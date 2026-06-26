import type { Plugin } from "vite";

const VIRTUAL_MODULE_ID = "virtual:treelocator-setup";
const RESOLVED_VIRTUAL_MODULE_ID = "\0" + VIRTUAL_MODULE_ID;

/**
 * Vite plugin for TreeLocatorJS.
 *
 * In dev mode, injects the runtime setup so you don't need to import
 * @treelocator/runtime in your entry file. Pair with @locator/babel-jsx
 * in your framework plugin for React/Solid/Preact projects.
 */
export default function treelocator(): Plugin {
  return {
    name: "treelocator",
    apply: "serve",

    resolveId(id) {
      if (id === VIRTUAL_MODULE_ID) {
        return RESOLVED_VIRTUAL_MODULE_ID;
      }
    },

    load(id) {
      if (id === RESOLVED_VIRTUAL_MODULE_ID) {
        return [
          `import setup from "@treelocator/runtime";`,
          `if (import.meta.env.DEV) setup();`,
        ].join("\n");
      }
    },

    transformIndexHtml: {
      order: "pre",
      handler() {
        return [
          {
            tag: "script",
            attrs: { type: "module" },
            children: `import "${VIRTUAL_MODULE_ID}";`,
            injectTo: "head-prepend",
          },
        ];
      },
    },
  };
}
