#!/usr/bin/env node

/**
 * TreeLocatorJS setup wizard CLI.
 *
 * Module layout:
 * - detect.ts     — project/package-manager/framework detection
 * - transforms.ts — vite/next config and entry-file edits
 * - check.ts      — `--check` mode validation and reporting
 * - utils.ts      — shared helpers (package.json IO, fatal errors)
 */

import { execSync } from "child_process";
import prompts from "prompts";
import pc from "picocolors";
import {
  detectProject,
  frameworkNeedsBabelJsx,
  getInstallCommand,
  usesReactPluginV6,
  type ProjectInfo,
} from "./detect.js";
import {
  addPagesRouterRuntimeImport,
  setupNextAppRouter,
  updateNextConfig,
  updateViteConfig,
} from "./transforms.js";
import { runCheck } from "./check.js";
import { exitWithError } from "./utils.js";

function packagesToInstall(info: ProjectInfo): string[] {
  const packages = ["@treelocator/runtime"];
  if (info.buildTool === "vite") {
    packages.push("@treelocator/vite");
    // Vue and Svelte don't need babel-jsx - they use built-in source tracking
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

async function runSetup(info: ProjectInfo, skipConfirm = false, useLocal = false): Promise<void> {
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
      initial: true,
    });

    if (!confirm) {
      console.log(pc.dim("Cancelled."));
      process.exit(0);
    }
  } else {
    console.log(pc.green("Running in non-interactive mode, proceeding with installation..."));
  }

  const packages = packagesToInstall(info);

  console.log(pc.dim(`\nInstalling ${packages.join(", ")}...`));
  const installCmd = getInstallCommand(info.packageManager, packages, useLocal);
  try {
    execSync(installCmd, { stdio: "inherit" });
  } catch {
    exitWithError("Failed to install packages.");
  }

  if (info.configFile) {
    console.log(pc.dim(`\nUpdating ${info.configFile}...`));
    if (info.buildTool === "vite") {
      updateViteConfig(info.configFile, info.framework);
    } else if (info.buildTool === "next") {
      updateNextConfig(info.configFile);
    }
  }

  if (info.buildTool === "next") {
    console.log(pc.dim("\nSetting up Next.js runtime..."));
    if (info.entryFile?.includes("_app.")) {
      console.log(pc.dim(`\nUpdating ${info.entryFile}...`));
      addPagesRouterRuntimeImport(info.entryFile);
    } else {
      setupNextAppRouter();
    }
  }

  console.log(pc.bold(pc.green("\nTreeLocatorJS installed successfully!")));
  console.log(pc.dim("\nUsage: Hold Alt and click any component to copy its ancestry.\n"));
}

function printHelp(): void {
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
  • @treelocator/runtime package is installed
  • @locator/babel-jsx (Vite) or @locator/webpack-loader (Next.js) is installed
  • Build config has the babel plugin / webpack loader configured
  • Vite plugin configured (or runtime imported in entry file)
  • Next.js LocatorProvider created (App Router)
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

// Re-exported for testing
export {
  detectPackageManager,
  detectProject,
  getInstallCommand,
  usesReactPluginV6,
  type ProjectInfo,
} from "./detect.js";
export {
  addRolldownBabelPlugin,
  addTreelocatorVitePlugin,
  injectBabelPluginIntoVitePlugin,
} from "./transforms.js";
export { checkConfiguration, type CheckResult } from "./check.js";
export { exitWithError, readPackageJson } from "./utils.js";

// Only run when invoked directly as CLI, not when imported for testing
const isDirectRun = process.argv[1] &&
  (import.meta.url === new URL(`file://${process.argv[1]}`).href ||
   import.meta.url.endsWith(process.argv[1]));

if (isDirectRun) {
  main().catch(console.error);
}
