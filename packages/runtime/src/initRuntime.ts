import { allTargets, Target } from "@locator/shared";
import { AdapterId, fontFamily } from "./consts";
import generatedStyles from "./_generated_styles";
import { MAX_ZINDEX } from "./index";
import { installBrowserAPI } from "./browserApi";
import { startMCPBridge } from "./mcpBridge";
import type { MCPBridgeConfig } from "./mcpBridge";

export function initRuntime({
  adapter,
  targets,
  mcp,
}: {
  adapter?: AdapterId;
  targets?: { [k: string]: Target | string };
  mcp?: MCPBridgeConfig;
} = {}) {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return;
  }
  if (document.getElementById("locatorjs-wrapper")) {
    // already initialized
    return;
  }

  // Install browser API on window.__treelocator__
  installBrowserAPI(adapter);
  startMCPBridge(mcp);

  // ponytail: warn only, no framework detection — tagged elements appear
  // asynchronously, so we just re-check a few times. Upgrade path: wire the
  // detected adapter id in and skip this for Vue/Svelte (no babel needed).
  let tagChecks = 0;
  const tagCheckTimer = setInterval(() => {
    tagChecks++;
    const tagged =
      document.querySelector("[data-locatorjs-id]") ||
      (window.__LOCATOR_DATA__ && Object.keys(window.__LOCATOR_DATA__).length > 0);
    if (tagged || tagChecks >= 4) {
      clearInterval(tagCheckTimer);
      if (!tagged) {
        console.warn(
          "[treelocator] Runtime is active but no elements carry data-locatorjs-id. " +
            "The babel plugin is probably not running (on Vite 7+/rolldown, @vitejs/plugin-react v5 silently skips babel). " +
            "See https://github.com/wende/treelocatorjs/blob/main/docs/TROUBLESHOOTING.md"
        );
      }
    }
  }, 2000);

  // add style tag to head
  const style = document.createElement("style");
  style.id = "locatorjs-style";
  style.innerHTML = `
      #locatorjs-layer {
        all: initial;
        pointer-events: none;
        font-family: ${fontFamily};
      }
      #locatorjs-layer * {
        box-sizing: border-box;
      }
      #locatorjs-labels-wrapper {
        display: flex;
        gap: 8px;
      }
      ${generatedStyles}
    `;

  const globalStyle = document.createElement("style");
  globalStyle.id = "locatorjs-global-style";
  globalStyle.innerHTML = `
      #locatorjs-wrapper {
        z-index: ${MAX_ZINDEX};
        pointer-events: none;
        position: fixed;
      }
      .locatorjs-active-pointer * {
        cursor: pointer !important;
      }
    `;

  const wrapper = document.createElement("div");
  wrapper.setAttribute("id", "locatorjs-wrapper");

  const shadow = wrapper.attachShadow({ mode: "open" });
  const layer = document.createElement("div");
  layer.setAttribute("id", "locatorjs-layer");

  shadow.appendChild(style);
  shadow.appendChild(layer);

  document.body.appendChild(wrapper);
  document.head.appendChild(globalStyle);

  // This weird import is needed because:
  // SSR React (Next.js) breaks when importing any SolidJS compiled file, so the import has to be conditional
  // Browser Extension breaks when importing with "import()"
  // Vite breaks when importing with "require()"
  if (typeof require !== "undefined") {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { initRender } = require("./components/Runtime");
    initRender(layer, adapter, targets || allTargets);
  } else {
    import("./components/Runtime").then(({ initRender }) => {
      initRender(layer, adapter, targets || allTargets);
    });
  }
}
