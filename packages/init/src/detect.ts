import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { exitWithError, readPackageJson } from "./utils.js";

export interface ProjectInfo {
  packageManager: "npm" | "yarn" | "pnpm" | "bun";
  buildTool: "vite" | "next" | "webpack" | "unknown";
  framework: "react" | "vue" | "svelte" | "preact" | "solid" | "unknown";
  hasTypeScript: boolean;
  configFile: string | null;
  entryFile: string | null;
}

/**
 * Vue and Svelte ship their own source tracking in dev mode; every other
 * supported Vite framework needs @locator/babel-jsx.
 */
export function frameworkNeedsBabelJsx(
  framework: ProjectInfo["framework"]
): boolean {
  return framework !== "vue" && framework !== "svelte";
}

export function getPackageVersion(name: string): string | null {
  const pkg = readPackageJson(process.cwd());
  if (!pkg) return null;
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  return deps[name] ?? null;
}

export function usesReactPluginV6(): boolean {
  const version = getPackageVersion("@vitejs/plugin-react");
  if (!version) return false;
  const major = parseInt(version.replace(/[\^~>=<]*/g, "").split(".")[0], 10);
  return !Number.isNaN(major) && major >= 6;
}

export function detectPackageManager(): ProjectInfo["packageManager"] {
  // Check current dir and parent dirs (for monorepos)
  let dir = process.cwd();
  const root = path.parse(dir).root;

  while (dir !== root) {
    if (fs.existsSync(path.join(dir, "bun.lockb"))) return "bun";
    if (fs.existsSync(path.join(dir, "pnpm-lock.yaml"))) return "pnpm";
    if (fs.existsSync(path.join(dir, "yarn.lock"))) return "yarn";
    if (fs.existsSync(path.join(dir, "package-lock.json"))) return "npm";
    dir = path.dirname(dir);
  }
  return "npm";
}

export function detectProject(): ProjectInfo {
  const pkgPath = path.join(process.cwd(), "package.json");
  if (!fs.existsSync(pkgPath)) {
    exitWithError("No package.json found. Run this from your project root.");
  }

  const pkg = readPackageJson(process.cwd());
  if (!pkg) {
    exitWithError("Failed to read package.json. Check that it contains valid JSON.");
  }
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };

  const info: ProjectInfo = {
    packageManager: detectPackageManager(),
    buildTool: "unknown",
    framework: "unknown",
    hasTypeScript: !!deps.typescript || fs.existsSync("tsconfig.json"),
    configFile: null,
    entryFile: null,
  };

  // Detect build tool
  if (deps.next) {
    info.buildTool = "next";
    info.configFile = fs.existsSync("next.config.ts")
      ? "next.config.ts"
      : fs.existsSync("next.config.mjs")
        ? "next.config.mjs"
        : "next.config.js";
  } else if (deps.vite) {
    info.buildTool = "vite";
    info.configFile = fs.existsSync("vite.config.ts")
      ? "vite.config.ts"
      : "vite.config.js";
  }

  // Detect framework
  if (deps.react || deps["react-dom"]) {
    info.framework = "react";
  } else if (deps.vue) {
    info.framework = "vue";
  } else if (deps.svelte) {
    info.framework = "svelte";
  } else if (deps.preact) {
    info.framework = "preact";
  } else if (deps["solid-js"] || deps["vite-plugin-solid"]) {
    info.framework = "solid";
  }

  // If we detected Vite, check the config to override framework detection
  // This handles mixed-framework projects where the vite config is authoritative
  if (info.buildTool === "vite" && info.configFile) {
    try {
      const viteConfig = fs.readFileSync(info.configFile, "utf-8");
      if (viteConfig.includes("vite-plugin-solid") || viteConfig.includes("solidPlugin")) {
        info.framework = "solid";
      } else if (viteConfig.includes("@vitejs/plugin-react") || viteConfig.includes("react()")) {
        info.framework = "react";
      } else if (viteConfig.includes("@vitejs/plugin-vue") || viteConfig.includes("vue()")) {
        info.framework = "vue";
      } else if (viteConfig.includes("@sveltejs/vite-plugin-svelte") || viteConfig.includes("svelte()")) {
        info.framework = "svelte";
      } else if (viteConfig.includes("@preact/preset-vite") || viteConfig.includes("preact()")) {
        info.framework = "preact";
      }
    } catch {
      // If config read fails, stick with package.json detection
    }
  }

  // Detect entry file
  const entryPaths = [
    "src/main.tsx",
    "src/main.ts",
    "src/main.jsx",
    "src/main.js",
    "src/index.tsx",
    "src/index.ts",
    "src/index.jsx",
    "src/index.js",
    "app/layout.tsx", // Next.js app router
    "app/layout.js",
    "pages/_app.tsx", // Next.js pages router
    "pages/_app.js",
  ];

  for (const entry of entryPaths) {
    if (fs.existsSync(entry)) {
      info.entryFile = entry;
      break;
    }
  }

  return info;
}

export function getInstallCommand(
  pm: ProjectInfo["packageManager"],
  packages: string[],
  useLocal = false
): string {
  const resolvedPackages = useLocal
    ? packages.map((pkg) => {
        const packageRoot = path.resolve(
          path.dirname(fileURLToPath(import.meta.url)),
          "../.."
        );
        if (pkg === "@treelocator/vite") {
          return `file:${path.join(packageRoot, "vite")}`;
        }
        if (pkg === "@treelocator/runtime") {
          return `file:${path.join(packageRoot, "runtime")}`;
        }
        return pkg;
      })
    : packages;

  const pkgs = resolvedPackages.join(" ");
  switch (pm) {
    case "bun":
      return `bun add -D ${pkgs}`;
    case "pnpm":
      return `pnpm add -D ${pkgs}`;
    case "yarn":
      return `yarn add -D ${pkgs}`;
    default:
      return `npm install -D ${pkgs}`;
  }
}
