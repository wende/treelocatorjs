#!/usr/bin/env node

// src/index.ts
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";
import prompts from "prompts";
import pc from "picocolors";
function readPackageJson(dir) {
  const pkgPath = path.join(dir, "package.json");
  try {
    return JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
  } catch {
    return null;
  }
}
function exitWithError(message) {
  console.error(pc.red(message));
  process.exit(1);
}
function getPackageVersion(name) {
  const pkg = readPackageJson(process.cwd());
  if (!pkg) return null;
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  return deps[name] ?? null;
}
function usesReactPluginV6() {
  const version = getPackageVersion("@vitejs/plugin-react");
  if (!version) return false;
  const major = parseInt(version.replace(/[\^~>=<]*/g, "").split(".")[0], 10);
  return !Number.isNaN(major) && major >= 6;
}
function addRolldownBabelPlugin(content) {
  if (content.includes("@rolldown/plugin-babel")) {
    return content;
  }
  const importLine = `import babel from "@rolldown/plugin-babel";
`;
  const importMatches = content.match(/^import .+;?\s*$/gm);
  if (importMatches?.length) {
    const reactImport = importMatches.find((line) => line.includes("@vitejs/plugin-react"));
    const anchor = reactImport ?? importMatches[importMatches.length - 1];
    content = content.replace(anchor, `${anchor}
${importLine.trim()}`);
  } else {
    content = importLine + content;
  }
  const babelCall = `babel({
      plugins: [
        ["@locator/babel-jsx/dist", { env: "development" }],
      ],
    })`;
  if (/react\(\{[\s\S]*?\}\)/.test(content)) {
    content = content.replace(/react\(\{[\s\S]*?\}\)/, (match) => `${match},
    ${babelCall}`);
  } else if (content.includes("react()")) {
    content = content.replace("react()", `react(),
    ${babelCall}`);
  }
  return content;
}
function addTreelocatorVitePlugin(content) {
  if (content.includes("@treelocator/vite")) {
    return content;
  }
  const importLine = `import treelocator from "@treelocator/vite";
`;
  const importMatches = content.match(/^import .+;?\s*$/gm);
  if (importMatches?.length) {
    const lastImport = importMatches[importMatches.length - 1];
    content = content.replace(lastImport, `${lastImport}
${importLine.trim()}`);
  } else {
    content = importLine + content;
  }
  const pluginsMatch = content.match(/plugins:\s*\[/);
  if (!pluginsMatch?.index) {
    return content;
  }
  let depth = 0;
  let start = pluginsMatch.index + pluginsMatch[0].length;
  let end = start;
  for (let i = start; i < content.length; i++) {
    const char = content[i];
    if (char === "[") depth++;
    if (char === "]") {
      if (depth === 0) {
        end = i;
        break;
      }
      depth--;
    }
  }
  const pluginsBody = content.slice(start, end).trim();
  const updatedPlugins = pluginsBody.length ? `${pluginsBody}, treelocator()` : "treelocator()";
  return content.slice(0, start) + updatedPlugins + content.slice(end);
}
function injectBabelPluginIntoVitePlugin(content, pluginNames, babelConfig) {
  for (const pluginName of pluginNames) {
    const emptyCallRegex = new RegExp(`${pluginName}\\(\\s*\\)`);
    const withOptionsRegex = new RegExp(`${pluginName}\\(\\s*\\{`);
    if (emptyCallRegex.test(content)) {
      content = content.replace(
        emptyCallRegex,
        `${pluginName}({
      ${babelConfig},
    })`
      );
      return content;
    } else if (withOptionsRegex.test(content)) {
      content = content.replace(
        withOptionsRegex,
        `${pluginName}({
      ${babelConfig},`
      );
      return content;
    }
  }
  return content;
}
function detectPackageManager() {
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
function detectProject() {
  const pkgPath = path.join(process.cwd(), "package.json");
  if (!fs.existsSync(pkgPath)) {
    exitWithError("No package.json found. Run this from your project root.");
  }
  const pkg = readPackageJson(process.cwd());
  if (!pkg) {
    exitWithError("Failed to read package.json. Check that it contains valid JSON.");
  }
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  const info = {
    packageManager: detectPackageManager(),
    buildTool: "unknown",
    framework: "unknown",
    hasTypeScript: !!deps.typescript || fs.existsSync("tsconfig.json"),
    configFile: null,
    entryFile: null
  };
  if (deps.next) {
    info.buildTool = "next";
    info.configFile = fs.existsSync("next.config.ts") ? "next.config.ts" : fs.existsSync("next.config.mjs") ? "next.config.mjs" : "next.config.js";
  } else if (deps.vite) {
    info.buildTool = "vite";
    info.configFile = fs.existsSync("vite.config.ts") ? "vite.config.ts" : "vite.config.js";
  }
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
    }
  }
  const entryPaths = [
    "src/main.tsx",
    "src/main.ts",
    "src/main.jsx",
    "src/main.js",
    "src/index.tsx",
    "src/index.ts",
    "src/index.jsx",
    "src/index.js",
    "app/layout.tsx",
    // Next.js app router
    "app/layout.js",
    "pages/_app.tsx",
    // Next.js pages router
    "pages/_app.js"
  ];
  for (const entry of entryPaths) {
    if (fs.existsSync(entry)) {
      info.entryFile = entry;
      break;
    }
  }
  return info;
}
function getInstallCommand(pm, packages, useLocal = false) {
  const resolvedPackages = useLocal ? packages.map((pkg) => {
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
  }) : packages;
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
function checkConfiguration(info) {
  const results = [];
  const pkg = readPackageJson(process.cwd());
  if (!pkg) {
    exitWithError("Failed to read package.json. Check that it contains valid JSON.");
  }
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  if (deps["@treelocator/runtime"]) {
    results.push({
      name: "@treelocator/runtime",
      status: "ok",
      message: `Installed (${deps["@treelocator/runtime"]})`
    });
  } else {
    results.push({
      name: "@treelocator/runtime",
      status: "error",
      message: "Not installed",
      fix: getInstallCommand(info.packageManager, ["@treelocator/runtime"])
    });
  }
  if (info.buildTool === "vite") {
    if (deps["@treelocator/vite"]) {
      results.push({
        name: "@treelocator/vite",
        status: "ok",
        message: `Installed (${deps["@treelocator/vite"]})`
      });
    } else {
      results.push({
        name: "@treelocator/vite",
        status: "error",
        message: "Not installed (required for Vite projects)",
        fix: getInstallCommand(info.packageManager, ["@treelocator/vite"])
      });
    }
  }
  const needsBabelJsx = info.buildTool === "vite" && info.framework !== "vue" && info.framework !== "svelte";
  if (needsBabelJsx) {
    if (deps["@locator/babel-jsx"]) {
      results.push({
        name: "@locator/babel-jsx",
        status: "ok",
        message: `Installed (${deps["@locator/babel-jsx"]})`
      });
    } else {
      results.push({
        name: "@locator/babel-jsx",
        status: "error",
        message: "Not installed (required for JSX frameworks with Vite)",
        fix: getInstallCommand(info.packageManager, ["@locator/babel-jsx"])
      });
    }
  } else if (info.buildTool === "next") {
    if (deps["@locator/webpack-loader"]) {
      results.push({
        name: "@locator/webpack-loader",
        status: "ok",
        message: `Installed (${deps["@locator/webpack-loader"]})`
      });
    } else {
      results.push({
        name: "@locator/webpack-loader",
        status: "error",
        message: "Not installed (required for Next.js)",
        fix: getInstallCommand(info.packageManager, ["@locator/webpack-loader"])
      });
    }
  }
  if (info.configFile && fs.existsSync(info.configFile)) {
    const configContent = fs.readFileSync(info.configFile, "utf-8");
    if (needsBabelJsx) {
      const reactV6 = info.framework === "react" && usesReactPluginV6();
      const hasLegacyBabel = configContent.includes("@locator/babel-jsx") || configContent.includes("locator/babel-jsx");
      const hasRolldownBabel = configContent.includes("@rolldown/plugin-babel");
      if (reactV6 && hasRolldownBabel || !reactV6 && hasLegacyBabel) {
        results.push({
          name: `${info.configFile} babel plugin`,
          status: "ok",
          message: reactV6 ? "Babel plugin configured (@rolldown/plugin-babel)" : "Babel plugin configured"
        });
      } else if (reactV6) {
        results.push({
          name: `${info.configFile} babel plugin`,
          status: "error",
          message: "@vitejs/plugin-react v6+ requires @rolldown/plugin-babel for source tracking",
          fix: "Run npx @treelocator/init to configure @rolldown/plugin-babel"
        });
      } else {
        const hasBabelConfig = configContent.includes("babel:");
        if (hasBabelConfig) {
          results.push({
            name: `${info.configFile} babel plugin`,
            status: "warning",
            message: "Babel config exists but @locator/babel-jsx not found",
            fix: `Add ["@locator/babel-jsx/dist", { env: "development" }] to babel.plugins`
          });
        } else {
          results.push({
            name: `${info.configFile} babel plugin`,
            status: "error",
            message: "Babel plugin not configured",
            fix: `Add babel: { plugins: [["@locator/babel-jsx/dist", { env: "development" }]] } to your framework plugin options`
          });
        }
      }
    } else if (info.buildTool === "next") {
      if (configContent.includes("@locator/webpack-loader") || configContent.includes("locator/webpack-loader")) {
        results.push({
          name: `${info.configFile} webpack loader`,
          status: "ok",
          message: "Webpack loader configured"
        });
      } else {
        results.push({
          name: `${info.configFile} webpack loader`,
          status: "error",
          message: "Webpack loader not configured",
          fix: `Add webpack config with @locator/webpack-loader to ${info.configFile}`
        });
      }
    }
  } else if (info.configFile) {
    results.push({
      name: `${info.configFile}`,
      status: "error",
      message: "Config file not found",
      fix: `Create ${info.configFile}`
    });
  }
  if (info.buildTool === "vite" && info.configFile && fs.existsSync(info.configFile)) {
    const configContent = fs.readFileSync(info.configFile, "utf-8");
    if (configContent.includes("@treelocator/vite")) {
      results.push({
        name: `${info.configFile} treelocator plugin`,
        status: "ok",
        message: "Vite plugin configured (auto-injects runtime)"
      });
    } else if (info.entryFile && fs.existsSync(info.entryFile)) {
      const entryContent = fs.readFileSync(info.entryFile, "utf-8");
      if (entryContent.includes("@treelocator/runtime")) {
        results.push({
          name: `${info.entryFile} runtime import`,
          status: "ok",
          message: "Runtime imported manually"
        });
      } else {
        results.push({
          name: `${info.configFile} treelocator plugin`,
          status: "warning",
          message: "Vite plugin not configured",
          fix: `Add treelocator() from @treelocator/vite to plugins, or import @treelocator/runtime in ${info.entryFile}`
        });
      }
    }
  } else if (info.buildTool === "next") {
    const appDir = fs.existsSync("src/app") ? "src/app" : "app";
    const providerPath = path.join(appDir, "LocatorProvider.tsx");
    const pagesAppPath = fs.existsSync("src/pages/_app.tsx") ? "src/pages/_app.tsx" : fs.existsSync("pages/_app.tsx") ? "pages/_app.tsx" : null;
    if (fs.existsSync(providerPath)) {
      results.push({
        name: `${providerPath}`,
        status: "ok",
        message: "LocatorProvider configured"
      });
    } else if (pagesAppPath && fs.existsSync(pagesAppPath)) {
      const appContent = fs.readFileSync(pagesAppPath, "utf-8");
      if (appContent.includes("@treelocator/runtime")) {
        results.push({
          name: `${pagesAppPath} runtime import`,
          status: "ok",
          message: "Runtime imported"
        });
      } else {
        results.push({
          name: `${pagesAppPath} runtime import`,
          status: "warning",
          message: "Runtime not imported",
          fix: `Add setupLocatorUI import to ${pagesAppPath}`
        });
      }
    } else if (info.entryFile?.includes("layout.")) {
      results.push({
        name: "Next.js runtime setup",
        status: "warning",
        message: "LocatorProvider not found",
        fix: "Run npx @treelocator/init to create LocatorProvider.tsx"
      });
    }
  }
  return results;
}
function printCheckResults(results) {
  let hasErrors = false;
  let hasWarnings = false;
  console.log(pc.bold("\nConfiguration Check Results:\n"));
  for (const result of results) {
    let icon;
    let color;
    switch (result.status) {
      case "ok":
        icon = "\u2713";
        color = pc.green;
        break;
      case "warning":
        icon = "\u26A0";
        color = pc.yellow;
        hasWarnings = true;
        break;
      case "error":
        icon = "\u2717";
        color = pc.red;
        hasErrors = true;
        break;
    }
    console.log(`  ${color(icon)} ${pc.bold(result.name)}`);
    console.log(`    ${color(result.message)}`);
    if (result.fix) {
      console.log(`    ${pc.dim("Fix:")} ${pc.cyan(result.fix)}`);
    }
    console.log();
  }
  if (hasErrors) {
    console.log(pc.red(pc.bold("Some required configurations are missing.")));
    console.log(pc.dim("Run without --check to set up TreeLocatorJS.\n"));
    return false;
  } else if (hasWarnings) {
    console.log(pc.yellow(pc.bold("Configuration looks good with minor warnings.")));
    console.log(pc.green("TreeLocatorJS should work correctly.\n"));
    return true;
  } else {
    console.log(pc.green(pc.bold("All configurations are correct!")));
    console.log(pc.green("TreeLocatorJS is properly set up.\n"));
    return true;
  }
}
function updateViteConfig(configFile, framework) {
  let content = fs.readFileSync(configFile, "utf-8");
  let changed = false;
  if (!content.includes("@treelocator/vite")) {
    content = addTreelocatorVitePlugin(content);
    changed = true;
  }
  const needsBabel = framework !== "vue" && framework !== "svelte";
  if (needsBabel && !content.includes("@locator/babel-jsx")) {
    if (framework === "react" && usesReactPluginV6()) {
      content = addRolldownBabelPlugin(content);
    } else {
      const babelConfig = `babel: {
        plugins: [
          ["@locator/babel-jsx/dist", { env: "development" }],
        ],
      }`;
      if (framework === "react") {
        content = injectBabelPluginIntoVitePlugin(content, ["react"], babelConfig);
      }
      if (framework === "solid") {
        content = injectBabelPluginIntoVitePlugin(content, ["solid", "solidPlugin"], babelConfig);
      }
      if (framework === "preact") {
        content = injectBabelPluginIntoVitePlugin(content, ["preact"], babelConfig);
      }
    }
    changed = true;
  } else if (needsBabel && framework === "react" && usesReactPluginV6() && !content.includes("@rolldown/plugin-babel")) {
    content = addRolldownBabelPlugin(content);
    changed = true;
  }
  if (!changed) {
    console.log(pc.yellow("TreeLocatorJS already configured in vite.config"));
    return;
  }
  fs.writeFileSync(configFile, content);
  console.log(pc.green(`Updated ${configFile}`));
}
function updateNextConfig(configFile) {
  let content = fs.readFileSync(configFile, "utf-8");
  if (content.includes("@locator/webpack-loader")) {
    console.log(pc.yellow("TreeLocatorJS webpack loader already configured in next.config"));
    return;
  }
  const webpackConfig = `
  webpack: (config) => {
    config.module.rules.push({
      test: /\\.tsx?$/,
      use: [
        { loader: "@locator/webpack-loader", options: { env: "development" } },
      ],
    });
    return config;
  },`;
  const configObjectPatterns = [
    /const nextConfig(?::\s*NextConfig)?\s*=\s*\{/,
    /module\.exports\s*=\s*\{/,
    /export default\s*\{/
  ];
  let updated = false;
  for (const pattern of configObjectPatterns) {
    if (pattern.test(content)) {
      content = content.replace(pattern, (match) => `${match}${webpackConfig}`);
      updated = true;
      break;
    }
  }
  if (!updated) {
    console.log(
      pc.yellow(
        `Could not auto-update ${configFile}. Add the webpack loader manually \u2014 see https://github.com/wende/treelocatorjs/blob/main/docs/NEXTJS-SETUP.md`
      )
    );
    return;
  }
  fs.writeFileSync(configFile, content);
  console.log(pc.green(`Updated ${configFile}`));
}
var LOCATOR_PROVIDER_SOURCE = `"use client";
import { useEffect } from "react";
import setupLocatorUI from "@treelocator/runtime";

export function LocatorProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      setupLocatorUI();
    }
  }, []);
  return <>{children}</>;
}
`;
function setupNextAppRouter() {
  const appDir = fs.existsSync("src/app") ? "src/app" : fs.existsSync("app") ? "app" : null;
  if (!appDir) return;
  const providerPath = path.join(appDir, "LocatorProvider.tsx");
  if (!fs.existsSync(providerPath)) {
    fs.writeFileSync(providerPath, LOCATOR_PROVIDER_SOURCE);
    console.log(pc.green(`Created ${providerPath}`));
  }
  const layoutCandidates = ["layout.tsx", "layout.js", "layout.jsx"].map(
    (file) => path.join(appDir, file)
  );
  const layoutPath = layoutCandidates.find((file) => fs.existsSync(file));
  if (!layoutPath) return;
  let content = fs.readFileSync(layoutPath, "utf-8");
  if (content.includes("LocatorProvider")) {
    console.log(pc.yellow("LocatorProvider already wired in layout"));
    return;
  }
  const importLine = `import { LocatorProvider } from "./LocatorProvider";
`;
  const importMatches = content.match(/^import .+;?\s*$/gm);
  if (importMatches?.length) {
    const lastImport = importMatches[importMatches.length - 1];
    content = content.replace(lastImport, `${lastImport}
${importLine.trim()}`);
  } else {
    content = importLine + content;
  }
  content = content.replace(/\{children\}/g, "<LocatorProvider>{children}</LocatorProvider>");
  fs.writeFileSync(layoutPath, content);
  console.log(pc.green(`Updated ${layoutPath}`));
}
function addPagesRouterRuntimeImport(entryFile) {
  let content = fs.readFileSync(entryFile, "utf-8");
  if (content.includes("@treelocator/runtime")) {
    console.log(pc.yellow("TreeLocatorJS runtime already imported"));
    return;
  }
  const importLine = `import setupLocatorUI from "@treelocator/runtime";
`;
  const setupCall = `
if (process.env.NODE_ENV === "development") {
  setupLocatorUI();
}
`;
  content = importLine + content;
  const lastImportIndex = content.lastIndexOf("import ");
  if (lastImportIndex !== -1) {
    const lineEnd = content.indexOf("\n", lastImportIndex);
    content = content.slice(0, lineEnd + 1) + setupCall + content.slice(lineEnd + 1);
  } else {
    content = content + setupCall;
  }
  fs.writeFileSync(entryFile, content);
  console.log(pc.green(`Updated ${entryFile}`));
}
async function runCheck(info) {
  console.log(pc.bold(pc.cyan("\n  TreeLocatorJS Configuration Check\n")));
  console.log(pc.dim("Detected:"));
  console.log(pc.dim(`  Package manager: ${info.packageManager}`));
  console.log(pc.dim(`  Build tool: ${info.buildTool}`));
  console.log(pc.dim(`  Framework: ${info.framework}`));
  console.log(pc.dim(`  Config file: ${info.configFile || "not found"}`));
  console.log(pc.dim(`  Entry file: ${info.entryFile || "not found"}`));
  if (info.buildTool === "unknown") {
    exitWithError("\nCould not detect build tool (Vite or Next.js). TreeLocatorJS currently supports Vite and Next.js projects.");
  }
  const results = checkConfiguration(info);
  const isOk = printCheckResults(results);
  process.exit(isOk ? 0 : 1);
}
async function runSetup(info, skipConfirm = false, useLocal = false) {
  console.log(pc.bold(pc.cyan("\n  TreeLocatorJS Setup Wizard\n")));
  console.log(pc.dim("Detected:"));
  console.log(pc.dim(`  Package manager: ${info.packageManager}`));
  console.log(pc.dim(`  Build tool: ${info.buildTool}`));
  console.log(pc.dim(`  Framework: ${info.framework}`));
  console.log(pc.dim(`  TypeScript: ${info.hasTypeScript}`));
  console.log();
  if (info.buildTool === "unknown") {
    exitWithError("Could not detect build tool (Vite or Next.js). TreeLocatorJS currently supports Vite and Next.js projects.");
  }
  if (info.framework === "unknown") {
    exitWithError("Could not detect framework.");
  }
  if (!skipConfirm) {
    const { confirm } = await prompts({
      type: "confirm",
      name: "confirm",
      message: "Install and configure TreeLocatorJS?",
      initial: true
    });
    if (!confirm) {
      console.log(pc.dim("Cancelled."));
      process.exit(0);
    }
  } else {
    console.log(pc.green("Running in non-interactive mode, proceeding with installation..."));
  }
  const packages = ["@treelocator/runtime"];
  if (info.buildTool === "vite") {
    packages.push("@treelocator/vite");
    if (info.framework !== "vue" && info.framework !== "svelte") {
      packages.push("@locator/babel-jsx");
      if (info.framework === "react" && usesReactPluginV6()) {
        packages.push("@rolldown/plugin-babel", "@babel/core");
      }
    }
  } else if (info.buildTool === "next") {
    packages.push("@locator/webpack-loader");
  }
  console.log(pc.dim(`
Installing ${packages.join(", ")}...`));
  const installCmd = getInstallCommand(info.packageManager, packages, useLocal);
  try {
    execSync(installCmd, { stdio: "inherit" });
  } catch {
    exitWithError("Failed to install packages.");
  }
  if (info.configFile) {
    console.log(pc.dim(`
Updating ${info.configFile}...`));
    if (info.buildTool === "vite") {
      updateViteConfig(info.configFile, info.framework);
    } else if (info.buildTool === "next") {
      updateNextConfig(info.configFile);
    }
  }
  if (info.buildTool === "next") {
    console.log(pc.dim("\nSetting up Next.js runtime..."));
    if (info.entryFile?.includes("layout.")) {
      setupNextAppRouter();
    } else if (info.entryFile?.includes("_app.")) {
      console.log(pc.dim(`
Updating ${info.entryFile}...`));
      addPagesRouterRuntimeImport(info.entryFile);
    } else {
      setupNextAppRouter();
    }
  }
  console.log(pc.bold(pc.green("\nTreeLocatorJS installed successfully!")));
  console.log(pc.dim("\nUsage: Hold Alt and click any component to copy its ancestry.\n"));
}
async function main() {
  const args = process.argv.slice(2);
  const isCheck = args.includes("--check") || args.includes("-c") || args.includes("check");
  const isHelp = args.includes("--help") || args.includes("-h") || args.includes("help");
  const isYes = args.includes("--yes") || args.includes("-y") || process.env.TREELOCATOR_AUTO_CONFIRM === "1";
  const useLocal = args.includes("--local") || process.env.TREELOCATOR_USE_LOCAL === "1";
  if (isHelp) {
    console.log(`
${pc.bold(pc.cyan("TreeLocatorJS Setup"))}

${pc.bold("Usage:")}
  npx @treelocator/init            Install and configure TreeLocatorJS
  npx treelocatorjs                Same as above (shorter alias)
  npx @treelocator/init check      Check if configuration is correct
  npx @treelocator/init --yes      Non-interactive install (CI-friendly)
  npx @treelocator/init --help     Show this help message

${pc.bold("Options:")}
  --check, -c, check    Verify existing configuration without making changes
  --yes, -y             Skip confirmation prompt (non-interactive mode)
  --local               Install workspace packages from monorepo (development only)
  --help, -h, help      Show this help message

${pc.bold("Environment Variables:")}
  TREELOCATOR_AUTO_CONFIRM=1    Skip confirmation prompt (same as --yes)

${pc.bold("What it checks:")}
  \u2022 @treelocator/runtime package is installed
  \u2022 @locator/babel-jsx (Vite) or @locator/webpack-loader (Next.js) is installed
  \u2022 Build config has the babel plugin / webpack loader configured
  \u2022 Vite plugin configured (or runtime imported in entry file)
  \u2022 Next.js LocatorProvider created (App Router)
`);
    process.exit(0);
  }
  const info = detectProject();
  if (isCheck) {
    await runCheck(info);
  } else {
    await runSetup(info, isYes, useLocal);
  }
}
var isDirectRun = process.argv[1] && (import.meta.url === new URL(`file://${process.argv[1]}`).href || import.meta.url.endsWith(process.argv[1]));
if (isDirectRun) {
  main().catch(console.error);
}
export {
  addRolldownBabelPlugin,
  addTreelocatorVitePlugin,
  checkConfiguration,
  detectPackageManager,
  detectProject,
  exitWithError,
  getInstallCommand,
  injectBabelPluginIntoVitePlugin,
  readPackageJson,
  usesReactPluginV6
};
