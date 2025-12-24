#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import prompts from "prompts";
import pc from "picocolors";

interface ProjectInfo {
  packageManager: "npm" | "yarn" | "pnpm" | "bun";
  buildTool: "vite" | "next" | "webpack" | "unknown";
  framework: "react" | "vue" | "svelte" | "preact" | "solid" | "unknown";
  hasTypeScript: boolean;
  configFile: string | null;
  entryFile: string | null;
}

interface CheckResult {
  name: string;
  status: "ok" | "warning" | "error";
  message: string;
  fix?: string;
}

function detectPackageManager(): ProjectInfo["packageManager"] {
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

function detectProject(): ProjectInfo {
  const pkgPath = path.join(process.cwd(), "package.json");
  if (!fs.existsSync(pkgPath)) {
    console.error(pc.red("No package.json found. Run this from your project root."));
    process.exit(1);
  }

  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
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

function getInstallCommand(pm: ProjectInfo["packageManager"], packages: string[]): string {
  const pkgs = packages.join(" ");
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

function checkConfiguration(info: ProjectInfo): CheckResult[] {
  const results: CheckResult[] = [];
  const pkgPath = path.join(process.cwd(), "package.json");
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };

  // Check 1: Runtime package installed
  if (deps["@treelocator/runtime"]) {
    results.push({
      name: "@treelocator/runtime",
      status: "ok",
      message: `Installed (${deps["@treelocator/runtime"]})`,
    });
  } else {
    results.push({
      name: "@treelocator/runtime",
      status: "error",
      message: "Not installed",
      fix: getInstallCommand(info.packageManager, ["@treelocator/runtime"]),
    });
  }

  // Check 2: Babel plugin or webpack loader installed
  // Vue and Svelte use built-in source tracking, so they don't need babel-jsx
  const needsBabelJsx = info.buildTool === "vite" && info.framework !== "vue" && info.framework !== "svelte";
  if (needsBabelJsx) {
    if (deps["@locator/babel-jsx"]) {
      results.push({
        name: "@locator/babel-jsx",
        status: "ok",
        message: `Installed (${deps["@locator/babel-jsx"]})`,
      });
    } else {
      results.push({
        name: "@locator/babel-jsx",
        status: "error",
        message: "Not installed (required for JSX frameworks with Vite)",
        fix: getInstallCommand(info.packageManager, ["@locator/babel-jsx"]),
      });
    }
  } else if (info.buildTool === "next") {
    if (deps["@locator/webpack-loader"]) {
      results.push({
        name: "@locator/webpack-loader",
        status: "ok",
        message: `Installed (${deps["@locator/webpack-loader"]})`,
      });
    } else {
      results.push({
        name: "@locator/webpack-loader",
        status: "error",
        message: "Not installed (required for Next.js)",
        fix: getInstallCommand(info.packageManager, ["@locator/webpack-loader"]),
      });
    }
  }

  // Check 3: Build config has babel plugin / webpack loader
  if (info.configFile && fs.existsSync(info.configFile)) {
    const configContent = fs.readFileSync(info.configFile, "utf-8");

    // Only check for babel config if framework needs it (not Vue/Svelte)
    if (needsBabelJsx) {
      // Check for babel-jsx plugin in vite config
      if (configContent.includes("@locator/babel-jsx") || configContent.includes("locator/babel-jsx")) {
        results.push({
          name: `${info.configFile} babel plugin`,
          status: "ok",
          message: "Babel plugin configured",
        });
      } else {
        // Check if the framework plugin has any babel config at all
        const hasBabelConfig = configContent.includes("babel:");
        if (hasBabelConfig) {
          results.push({
            name: `${info.configFile} babel plugin`,
            status: "warning",
            message: "Babel config exists but @locator/babel-jsx not found",
            fix: `Add ["@locator/babel-jsx/dist", { env: "development" }] to babel.plugins`,
          });
        } else {
          results.push({
            name: `${info.configFile} babel plugin`,
            status: "error",
            message: "Babel plugin not configured",
            fix: `Add babel: { plugins: [["@locator/babel-jsx/dist", { env: "development" }]] } to your framework plugin options`,
          });
        }
      }
    } else if (info.buildTool === "next") {
      if (configContent.includes("@locator/webpack-loader") || configContent.includes("locator/webpack-loader")) {
        results.push({
          name: `${info.configFile} webpack loader`,
          status: "ok",
          message: "Webpack loader configured",
        });
      } else {
        results.push({
          name: `${info.configFile} webpack loader`,
          status: "error",
          message: "Webpack loader not configured",
          fix: `Add webpack config with @locator/webpack-loader to ${info.configFile}`,
        });
      }
    }
  } else if (info.configFile) {
    results.push({
      name: `${info.configFile}`,
      status: "error",
      message: "Config file not found",
      fix: `Create ${info.configFile}`,
    });
  }

  // Check 4: Runtime import in entry file
  if (info.entryFile && fs.existsSync(info.entryFile)) {
    const entryContent = fs.readFileSync(info.entryFile, "utf-8");
    if (entryContent.includes("@treelocator/runtime")) {
      results.push({
        name: `${info.entryFile} runtime import`,
        status: "ok",
        message: "Runtime imported",
      });
    } else {
      results.push({
        name: `${info.entryFile} runtime import`,
        status: "warning",
        message: "Runtime not imported (optional but recommended)",
        fix: `Add: import "@treelocator/runtime"`,
      });
    }
  }

  return results;
}

function printCheckResults(results: CheckResult[]): boolean {
  let hasErrors = false;
  let hasWarnings = false;

  console.log(pc.bold("\nConfiguration Check Results:\n"));

  for (const result of results) {
    let icon: string;
    let color: (s: string) => string;

    switch (result.status) {
      case "ok":
        icon = "✓";
        color = pc.green;
        break;
      case "warning":
        icon = "⚠";
        color = pc.yellow;
        hasWarnings = true;
        break;
      case "error":
        icon = "✗";
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

function updateViteConfig(configFile: string, framework: string): void {
  let content = fs.readFileSync(configFile, "utf-8");

  // Check if already configured
  if (content.includes("@locator/babel-jsx")) {
    console.log(pc.yellow("TreeLocatorJS babel plugin already configured in vite.config"));
    return;
  }

  const babelConfig = `babel: {
        plugins: [
          ["@locator/babel-jsx/dist", { env: "development" }],
        ],
      }`;

  // For React with Vite, add babel plugin
  if (framework === "react") {
    // Find the react plugin and add babel config
    const reactPluginRegex = /react\(\s*\)/;
    const reactPluginWithOptionsRegex = /react\(\s*\{/;

    if (reactPluginRegex.test(content)) {
      content = content.replace(
        reactPluginRegex,
        `react({
      ${babelConfig},
    })`
      );
    } else if (reactPluginWithOptionsRegex.test(content)) {
      // Already has options, need to add babel config
      content = content.replace(
        /react\(\s*\{/,
        `react({
      ${babelConfig},`
      );
    }
  }

  // For SolidJS with Vite, add babel plugin
  if (framework === "solid") {
    // Try both solidPlugin() and solid() patterns
    const solidPluginRegex = /solid(?:Plugin)?\(\s*\)/;
    const solidPluginWithOptionsRegex = /solid(?:Plugin)?\(\s*\{/;

    if (solidPluginRegex.test(content)) {
      content = content.replace(
        solidPluginRegex,
        (match) => {
          const funcName = match.includes("solidPlugin") ? "solidPlugin" : "solid";
          return `${funcName}({
      ${babelConfig},
    })`;
        }
      );
    } else if (solidPluginWithOptionsRegex.test(content)) {
      // Already has options, need to add babel config
      content = content.replace(
        /solid(?:Plugin)?\(\s*\{/,
        (match) => {
          const funcName = match.includes("solidPlugin") ? "solidPlugin" : "solid";
          return `${funcName}({
      ${babelConfig},`;
        }
      );
    }
  }

  // For Preact with Vite, add babel plugin
  if (framework === "preact") {
    const preactPluginRegex = /preact\(\s*\)/;
    const preactPluginWithOptionsRegex = /preact\(\s*\{/;

    if (preactPluginRegex.test(content)) {
      content = content.replace(
        preactPluginRegex,
        `preact({
      ${babelConfig},
    })`
      );
    } else if (preactPluginWithOptionsRegex.test(content)) {
      // Already has options, need to add babel config
      content = content.replace(
        /preact\(\s*\{/,
        `preact({
      ${babelConfig},`
      );
    }
  }

  fs.writeFileSync(configFile, content);
  console.log(pc.green(`Updated ${configFile}`));
}

function updateNextConfig(configFile: string): void {
  let content = fs.readFileSync(configFile, "utf-8");

  // Check if already configured
  if (content.includes("@locator/webpack-loader")) {
    console.log(pc.yellow("TreeLocatorJS webpack loader already configured in next.config"));
    return;
  }

  // Add webpack config
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

  // Try to insert webpack config
  if (content.includes("const nextConfig = {")) {
    content = content.replace(
      "const nextConfig = {",
      `const nextConfig = {${webpackConfig}`
    );
  } else if (content.includes("module.exports = {")) {
    content = content.replace(
      "module.exports = {",
      `module.exports = {${webpackConfig}`
    );
  } else if (content.includes("export default {")) {
    content = content.replace(
      "export default {",
      `export default {${webpackConfig}`
    );
  }

  fs.writeFileSync(configFile, content);
  console.log(pc.green(`Updated ${configFile}`));
}

function addRuntimeImport(entryFile: string, isNextApp: boolean): void {
  let content = fs.readFileSync(entryFile, "utf-8");

  // Check if already configured
  if (content.includes("@treelocator/runtime")) {
    console.log(pc.yellow("TreeLocatorJS runtime already imported"));
    return;
  }

  const importLine = `import setupLocatorUI from "@treelocator/runtime";\n`;
  const setupCall = isNextApp
    ? "" // For Next.js, we need a different approach
    : `\nif (import.meta.env.DEV) {\n  setupLocatorUI();\n}\n`;

  if (isNextApp) {
    // For Next.js app router, suggest creating a provider
    console.log(pc.yellow("\nFor Next.js App Router, create a client component:"));
    console.log(pc.cyan(`
// app/LocatorProvider.tsx
"use client";
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

// Then wrap your app in app/layout.tsx:
// <LocatorProvider>{children}</LocatorProvider>
`));
    return;
  }

  // Add import at the top
  content = importLine + content;

  // Add setup call after imports
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

async function runCheck(info: ProjectInfo): Promise<void> {
  console.log(pc.bold(pc.cyan("\n  TreeLocatorJS Configuration Check\n")));

  console.log(pc.dim("Detected:"));
  console.log(pc.dim(`  Package manager: ${info.packageManager}`));
  console.log(pc.dim(`  Build tool: ${info.buildTool}`));
  console.log(pc.dim(`  Framework: ${info.framework}`));
  console.log(pc.dim(`  Config file: ${info.configFile || "not found"}`));
  console.log(pc.dim(`  Entry file: ${info.entryFile || "not found"}`));

  if (info.buildTool === "unknown") {
    console.log(pc.red("\nCould not detect build tool (Vite or Next.js)."));
    console.log(pc.dim("TreeLocatorJS currently supports Vite and Next.js projects."));
    process.exit(1);
  }

  const results = checkConfiguration(info);
  const isOk = printCheckResults(results);

  process.exit(isOk ? 0 : 1);
}

async function runSetup(info: ProjectInfo, skipConfirm = false): Promise<void> {
  console.log(pc.bold(pc.cyan("\n  TreeLocatorJS Setup Wizard\n")));

  console.log(pc.dim("Detected:"));
  console.log(pc.dim(`  Package manager: ${info.packageManager}`));
  console.log(pc.dim(`  Build tool: ${info.buildTool}`));
  console.log(pc.dim(`  Framework: ${info.framework}`));
  console.log(pc.dim(`  TypeScript: ${info.hasTypeScript}`));
  console.log();

  if (info.buildTool === "unknown") {
    console.log(pc.red("Could not detect build tool (Vite or Next.js)."));
    console.log(pc.dim("TreeLocatorJS currently supports Vite and Next.js projects."));
    process.exit(1);
  }

  if (info.framework === "unknown") {
    console.log(pc.red("Could not detect framework."));
    process.exit(1);
  }

  if (!skipConfirm) {
    const { confirm } = await prompts({
      type: "confirm",
      name: "confirm",
      message: "Install and configure TreeLocatorJS?",
      initial: true,
    });

    if (!confirm) {
      console.log(pc.dim("Cancelled."));
      process.exit(0);
    }
  } else {
    console.log(pc.green("Running in non-interactive mode, proceeding with installation..."));
  }

  // Determine packages to install
  const packages = ["@treelocator/runtime"];
  if (info.buildTool === "vite") {
    // Vue and Svelte don't need babel-jsx - they use built-in source tracking
    if (info.framework !== "vue" && info.framework !== "svelte") {
      packages.push("@locator/babel-jsx");
    }
  } else if (info.buildTool === "next") {
    packages.push("@locator/webpack-loader");
  }

  // Install packages
  console.log(pc.dim(`\nInstalling ${packages.join(", ")}...`));
  const installCmd = getInstallCommand(info.packageManager, packages);
  try {
    execSync(installCmd, { stdio: "inherit" });
  } catch {
    console.error(pc.red("Failed to install packages."));
    process.exit(1);
  }

  // Update config (only for frameworks that need babel plugin)
  if (info.configFile) {
    const needsConfigUpdate =
      info.buildTool === "next" ||
      (info.buildTool === "vite" && info.framework !== "vue" && info.framework !== "svelte");

    if (needsConfigUpdate) {
      console.log(pc.dim(`\nUpdating ${info.configFile}...`));
      if (info.buildTool === "vite") {
        updateViteConfig(info.configFile, info.framework);
      } else if (info.buildTool === "next") {
        updateNextConfig(info.configFile);
      }
    } else {
      console.log(pc.dim(`\nNo config update needed for ${info.framework} (uses built-in source tracking)`));
    }
  }

  // Add runtime import
  if (info.entryFile) {
    console.log(pc.dim(`\nUpdating ${info.entryFile}...`));
    const isNextApp = info.entryFile.startsWith("app/");
    addRuntimeImport(info.entryFile, isNextApp);
  }

  console.log(pc.bold(pc.green("\nTreeLocatorJS installed successfully!")));
  console.log(pc.dim("\nUsage: Hold Alt and click any component to copy its ancestry.\n"));
}

async function main() {
  const args = process.argv.slice(2);
  const isCheck = args.includes("--check") || args.includes("-c") || args.includes("check");
  const isHelp = args.includes("--help") || args.includes("-h") || args.includes("help");
  const isYes = args.includes("--yes") || args.includes("-y") || process.env.TREELOCATOR_AUTO_CONFIRM === "1";

  if (isHelp) {
    console.log(`
${pc.bold(pc.cyan("TreeLocatorJS Setup"))}

${pc.bold("Usage:")}
  npx @treelocator/init          Install and configure TreeLocatorJS
  npx @treelocator/init check    Check if configuration is correct
  npx @treelocator/init --help   Show this help message

${pc.bold("Options:")}
  --check, -c, check    Verify existing configuration without making changes
  --yes, -y             Skip confirmation prompt (non-interactive mode)
  --help, -h, help      Show this help message

${pc.bold("Environment Variables:")}
  TREELOCATOR_AUTO_CONFIRM=1    Skip confirmation prompt (same as --yes)

${pc.bold("What it checks:")}
  • @treelocator/runtime package is installed
  • @locator/babel-jsx (Vite) or @locator/webpack-loader (Next.js) is installed
  • Build config has the babel plugin / webpack loader configured
  • Entry file imports the runtime (optional)
`);
    process.exit(0);
  }

  const info = detectProject();

  if (isCheck) {
    await runCheck(info);
  } else {
    await runSetup(info, isYes);
  }
}

main().catch(console.error);
