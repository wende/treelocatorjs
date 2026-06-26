// src/index.ts
var VIRTUAL_MODULE_ID = "virtual:treelocator-setup";
var RESOLVED_VIRTUAL_MODULE_ID = "\0" + VIRTUAL_MODULE_ID;
function treelocator() {
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
          `if (import.meta.env.DEV) setup();`
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
            injectTo: "head-prepend"
          }
        ];
      }
    }
  };
}
export {
  treelocator as default
};
