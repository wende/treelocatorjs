#!/usr/bin/env node

// src/index.ts
import { execSync } from "child_process";
import prompts from "prompts";
import pc4 from "picocolors";

// src/detect.ts
import fs2 from "fs";
import path2 from "path";
import { fileURLToPath } from "url";

// src/utils.ts
import fs from "fs";
import path from "path";
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

// src/detect.ts
function frameworkNeedsBabelJsx(framework) {
  return framework !== "vue" && framework !== "svelte";
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
function detectPackageManager() {
  let dir = process.cwd();
  const root = path2.parse(dir).root;
  while (dir !== root) {
    if (fs2.existsSync(path2.join(dir, "bun.lockb"))) return "bun";
    if (fs2.existsSync(path2.join(dir, "pnpm-lock.yaml"))) return "pnpm";
    if (fs2.existsSync(path2.join(dir, "yarn.lock"))) return "yarn";
    if (fs2.existsSync(path2.join(dir, "package-lock.json"))) return "npm";
    dir = path2.dirname(dir);
  }
  return "npm";
}
function detectProject() {
  const pkgPath = path2.join(process.cwd(), "package.json");
  if (!fs2.existsSync(pkgPath)) {
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
    hasTypeScript: !!deps.typescript || fs2.existsSync("tsconfig.json"),
    configFile: null,
    entryFile: null
  };
  if (deps.next) {
    info.buildTool = "next";
    info.configFile = fs2.existsSync("next.config.ts") ? "next.config.ts" : fs2.existsSync("next.config.mjs") ? "next.config.mjs" : "next.config.js";
  } else if (deps.vite) {
    info.buildTool = "vite";
    info.configFile = fs2.existsSync("vite.config.ts") ? "vite.config.ts" : "vite.config.js";
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
      const viteConfig = fs2.readFileSync(info.configFile, "utf-8");
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
    if (fs2.existsSync(entry)) {
      info.entryFile = entry;
      break;
    }
  }
  return info;
}
function getInstallCommand(pm, packages, useLocal = false) {
  const resolvedPackages = useLocal ? packages.map((pkg) => {
    const packageRoot = path2.resolve(
      path2.dirname(fileURLToPath(import.meta.url)),
      "../.."
    );
    if (pkg === "@treelocator/vite") {
      return `file:${path2.join(packageRoot, "vite")}`;
    }
    if (pkg === "@treelocator/runtime") {
      return `file:${path2.join(packageRoot, "runtime")}`;
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

// src/transforms.ts
import fs3 from "fs";
import path3 from "path";
import pc2 from "picocolors";
function insertImportAfterLast(content, importLine, preferAnchor) {
  const importMatches = content.match(/^import .+;?\s*$/gm);
  if (importMatches?.length) {
    const anchor = (preferAnchor && importMatches.find(preferAnchor)) ?? importMatches[importMatches.length - 1];
    return content.replace(anchor, `${anchor}
${importLine}`);
  }
  return `${importLine}
${content}`;
}
function addRolldownBabelPlugin(content) {
  if (content.includes("@rolldown/plugin-babel")) {
    return content;
  }
  content = insertImportAfterLast(
    content,
    `import babel from "@rolldown/plugin-babel";`,
    (line) => line.includes("@vitejs/plugin-react")
  );
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
  content = insertImportAfterLast(
    content,
    `import treelocator from "@treelocator/vite";`
  );
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
var VITE_PLUGIN_NAMES = {
  react: ["react"],
  solid: ["solid", "solidPlugin"],
  preact: ["preact"]
};
function updateViteConfig(configFile, framework) {
  let content = fs3.readFileSync(configFile, "utf-8");
  let changed = false;
  if (!content.includes("@treelocator/vite")) {
    content = addTreelocatorVitePlugin(content);
    changed = true;
  }
  const needsBabel = frameworkNeedsBabelJsx(framework);
  if (needsBabel && !content.includes("@locator/babel-jsx")) {
    if (framework === "react" && usesReactPluginV6()) {
      content = addRolldownBabelPlugin(content);
    } else {
      const babelConfig = `babel: {
        plugins: [
          ["@locator/babel-jsx/dist", { env: "development" }],
        ],
      }`;
      const pluginNames = VITE_PLUGIN_NAMES[framework];
      if (pluginNames) {
        content = injectBabelPluginIntoVitePlugin(content, pluginNames, babelConfig);
      }
    }
    changed = true;
  } else if (needsBabel && framework === "react" && usesReactPluginV6() && !content.includes("@rolldown/plugin-babel")) {
    content = addRolldownBabelPlugin(content);
    changed = true;
  }
  if (!changed) {
    console.log(pc2.yellow("TreeLocatorJS already configured in vite.config"));
    return;
  }
  fs3.writeFileSync(configFile, content);
  console.log(pc2.green(`Updated ${configFile}`));
}
function updateNextConfig(configFile) {
  let content = fs3.readFileSync(configFile, "utf-8");
  if (content.includes("@locator/webpack-loader")) {
    console.log(pc2.yellow("TreeLocatorJS webpack loader already configured in next.config"));
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
      pc2.yellow(
        `Could not auto-update ${configFile}. Add the webpack loader manually \u2014 see https://github.com/wende/treelocatorjs/blob/main/docs/NEXTJS-SETUP.md`
      )
    );
    return;
  }
  fs3.writeFileSync(configFile, content);
  console.log(pc2.green(`Updated ${configFile}`));
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
  const appDir = fs3.existsSync("src/app") ? "src/app" : fs3.existsSync("app") ? "app" : null;
  if (!appDir) return;
  const providerPath = path3.join(appDir, "LocatorProvider.tsx");
  if (!fs3.existsSync(providerPath)) {
    fs3.writeFileSync(providerPath, LOCATOR_PROVIDER_SOURCE);
    console.log(pc2.green(`Created ${providerPath}`));
  }
  const layoutCandidates = ["layout.tsx", "layout.js", "layout.jsx"].map(
    (file) => path3.join(appDir, file)
  );
  const layoutPath = layoutCandidates.find((file) => fs3.existsSync(file));
  if (!layoutPath) return;
  let content = fs3.readFileSync(layoutPath, "utf-8");
  if (content.includes("LocatorProvider")) {
    console.log(pc2.yellow("LocatorProvider already wired in layout"));
    return;
  }
  content = insertImportAfterLast(
    content,
    `import { LocatorProvider } from "./LocatorProvider";`
  );
  content = content.replace(/\{children\}/g, "<LocatorProvider>{children}</LocatorProvider>");
  fs3.writeFileSync(layoutPath, content);
  console.log(pc2.green(`Updated ${layoutPath}`));
}
function addPagesRouterRuntimeImport(entryFile) {
  let content = fs3.readFileSync(entryFile, "utf-8");
  if (content.includes("@treelocator/runtime")) {
    console.log(pc2.yellow("TreeLocatorJS runtime already imported"));
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
  fs3.writeFileSync(entryFile, content);
  console.log(pc2.green(`Updated ${entryFile}`));
}

// src/check.ts
import fs4 from "fs";
import path4 from "path";
import pc3 from "picocolors";
function packageCheck(deps, info, name, missingMessage) {
  if (deps[name]) {
    return { name, status: "ok", message: `Installed (${deps[name]})` };
  }
  return {
    name,
    status: "error",
    message: missingMessage,
    fix: getInstallCommand(info.packageManager, [name])
  };
}
function checkConfiguration(info) {
  const results = [];
  const pkg = readPackageJson(process.cwd());
  if (!pkg) {
    exitWithError("Failed to read package.json. Check that it contains valid JSON.");
  }
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  results.push(packageCheck(deps, info, "@treelocator/runtime", "Not installed"));
  if (info.buildTool === "vite") {
    results.push(
      packageCheck(
        deps,
        info,
        "@treelocator/vite",
        "Not installed (required for Vite projects)"
      )
    );
  }
  const needsBabelJsx = info.buildTool === "vite" && frameworkNeedsBabelJsx(info.framework);
  if (needsBabelJsx) {
    results.push(
      packageCheck(
        deps,
        info,
        "@locator/babel-jsx",
        "Not installed (required for JSX frameworks with Vite)"
      )
    );
  } else if (info.buildTool === "next") {
    results.push(
      packageCheck(
        deps,
        info,
        "@locator/webpack-loader",
        "Not installed (required for Next.js)"
      )
    );
  }
  if (info.configFile && fs4.existsSync(info.configFile)) {
    const configContent = fs4.readFileSync(info.configFile, "utf-8");
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
  if (info.buildTool === "vite" && info.configFile && fs4.existsSync(info.configFile)) {
    const configContent = fs4.readFileSync(info.configFile, "utf-8");
    if (configContent.includes("@treelocator/vite")) {
      results.push({
        name: `${info.configFile} treelocator plugin`,
        status: "ok",
        message: "Vite plugin configured (auto-injects runtime)"
      });
    } else if (info.entryFile && fs4.existsSync(info.entryFile)) {
      const entryContent = fs4.readFileSync(info.entryFile, "utf-8");
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
    const appDir = fs4.existsSync("src/app") ? "src/app" : "app";
    const providerPath = path4.join(appDir, "LocatorProvider.tsx");
    const pagesAppPath = fs4.existsSync("src/pages/_app.tsx") ? "src/pages/_app.tsx" : fs4.existsSync("pages/_app.tsx") ? "pages/_app.tsx" : null;
    if (fs4.existsSync(providerPath)) {
      results.push({
        name: `${providerPath}`,
        status: "ok",
        message: "LocatorProvider configured"
      });
    } else if (pagesAppPath && fs4.existsSync(pagesAppPath)) {
      const appContent = fs4.readFileSync(pagesAppPath, "utf-8");
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
  console.log(pc3.bold("\nConfiguration Check Results:\n"));
  for (const result of results) {
    let icon;
    let color;
    switch (result.status) {
      case "ok":
        icon = "\u2713";
        color = pc3.green;
        break;
      case "warning":
        icon = "\u26A0";
        color = pc3.yellow;
        hasWarnings = true;
        break;
      case "error":
        icon = "\u2717";
        color = pc3.red;
        hasErrors = true;
        break;
    }
    console.log(`  ${color(icon)} ${pc3.bold(result.name)}`);
    console.log(`    ${color(result.message)}`);
    if (result.fix) {
      console.log(`    ${pc3.dim("Fix:")} ${pc3.cyan(result.fix)}`);
    }
    console.log();
  }
  if (hasErrors) {
    console.log(pc3.red(pc3.bold("Some required configurations are missing.")));
    console.log(pc3.dim("Run without --check to set up TreeLocatorJS.\n"));
    return false;
  } else if (hasWarnings) {
    console.log(pc3.yellow(pc3.bold("Configuration looks good with minor warnings.")));
    console.log(pc3.green("TreeLocatorJS should work correctly.\n"));
    return true;
  } else {
    console.log(pc3.green(pc3.bold("All configurations are correct!")));
    console.log(pc3.green("TreeLocatorJS is properly set up.\n"));
    return true;
  }
}
function runCheck(info) {
  console.log(pc3.bold(pc3.cyan("\n  TreeLocatorJS Configuration Check\n")));
  console.log(pc3.dim("Detected:"));
  console.log(pc3.dim(`  Package manager: ${info.packageManager}`));
  console.log(pc3.dim(`  Build tool: ${info.buildTool}`));
  console.log(pc3.dim(`  Framework: ${info.framework}`));
  console.log(pc3.dim(`  Config file: ${info.configFile || "not found"}`));
  console.log(pc3.dim(`  Entry file: ${info.entryFile || "not found"}`));
  if (info.buildTool === "unknown") {
    exitWithError("\nCould not detect build tool (Vite or Next.js). TreeLocatorJS currently supports Vite and Next.js projects.");
  }
  const results = checkConfiguration(info);
  const isOk = printCheckResults(results);
  process.exit(isOk ? 0 : 1);
}

// src/index.ts
function packagesToInstall(info) {
  const packages = ["@treelocator/runtime"];
  if (info.buildTool === "vite") {
    packages.push("@treelocator/vite");
    if (frameworkNeedsBabelJsx(info.framework)) {
      packages.push("@locator/babel-jsx");
      if (info.framework === "react" && usesReactPluginV6()) {
        packages.push("@rolldown/plugin-babel", "@babel/core");
      }
    }
  } else if (info.buildTool === "next") {
    packages.push("@locator/webpack-loader");
  }
  return packages;
}
async function runSetup(info, skipConfirm = false, useLocal = false) {
  console.log(pc4.bold(pc4.cyan("\n  TreeLocatorJS Setup Wizard\n")));
  console.log(pc4.dim("Detected:"));
  console.log(pc4.dim(`  Package manager: ${info.packageManager}`));
  console.log(pc4.dim(`  Build tool: ${info.buildTool}`));
  console.log(pc4.dim(`  Framework: ${info.framework}`));
  console.log(pc4.dim(`  TypeScript: ${info.hasTypeScript}`));
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
      console.log(pc4.dim("Cancelled."));
      process.exit(0);
    }
  } else {
    console.log(pc4.green("Running in non-interactive mode, proceeding with installation..."));
  }
  const packages = packagesToInstall(info);
  console.log(pc4.dim(`
Installing ${packages.join(", ")}...`));
  const installCmd = getInstallCommand(info.packageManager, packages, useLocal);
  try {
    execSync(installCmd, { stdio: "inherit" });
  } catch {
    exitWithError("Failed to install packages.");
  }
  if (info.configFile) {
    console.log(pc4.dim(`
Updating ${info.configFile}...`));
    if (info.buildTool === "vite") {
      updateViteConfig(info.configFile, info.framework);
    } else if (info.buildTool === "next") {
      updateNextConfig(info.configFile);
    }
  }
  if (info.buildTool === "next") {
    console.log(pc4.dim("\nSetting up Next.js runtime..."));
    if (info.entryFile?.includes("_app.")) {
      console.log(pc4.dim(`
Updating ${info.entryFile}...`));
      addPagesRouterRuntimeImport(info.entryFile);
    } else {
      setupNextAppRouter();
    }
  }
  console.log(pc4.bold(pc4.green("\nTreeLocatorJS installed successfully!")));
  console.log(pc4.dim("\nUsage: Hold Alt and click any component to copy its ancestry.\n"));
}
function printHelp() {
  console.log(`
${pc4.bold(pc4.cyan("TreeLocatorJS Setup"))}

${pc4.bold("Usage:")}
  npx @treelocator/init            Install and configure TreeLocatorJS
  npx treelocatorjs                Same as above (shorter alias)
  npx @treelocator/init check      Check if configuration is correct
  npx @treelocator/init --yes      Non-interactive install (CI-friendly)
  npx @treelocator/init --help     Show this help message

${pc4.bold("Options:")}
  --check, -c, check    Verify existing configuration without making changes
  --yes, -y             Skip confirmation prompt (non-interactive mode)
  --local               Install workspace packages from monorepo (development only)
  --help, -h, help      Show this help message

${pc4.bold("Environment Variables:")}
  TREELOCATOR_AUTO_CONFIRM=1    Skip confirmation prompt (same as --yes)

${pc4.bold("What it checks:")}
  \u2022 @treelocator/runtime package is installed
  \u2022 @locator/babel-jsx (Vite) or @locator/webpack-loader (Next.js) is installed
  \u2022 Build config has the babel plugin / webpack loader configured
  \u2022 Vite plugin configured (or runtime imported in entry file)
  \u2022 Next.js LocatorProvider created (App Router)
`);
}
async function main() {
  const args = process.argv.slice(2);
  const isCheck = args.includes("--check") || args.includes("-c") || args.includes("check");
  const isHelp = args.includes("--help") || args.includes("-h") || args.includes("help");
  const isYes = args.includes("--yes") || args.includes("-y") || process.env.TREELOCATOR_AUTO_CONFIRM === "1";
  const useLocal = args.includes("--local") || process.env.TREELOCATOR_USE_LOCAL === "1";
  if (isHelp) {
    printHelp();
    process.exit(0);
  }
  const info = detectProject();
  if (isCheck) {
    runCheck(info);
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
