/**
 * `--check` mode: verify an existing TreeLocatorJS setup without changing it.
 */

import fs from "fs";
import path from "path";
import pc from "picocolors";
import {
  frameworkNeedsBabelJsx,
  getInstallCommand,
  usesReactPluginV6,
  type ProjectInfo,
} from "./detect.js";
import { exitWithError, readPackageJson } from "./utils.js";

export interface CheckResult {
  name: string;
  status: "ok" | "warning" | "error";
  message: string;
  fix?: string;
}

function packageCheck(
  deps: Record<string, any>,
  info: ProjectInfo,
  name: string,
  missingMessage: string
): CheckResult {
  if (deps[name]) {
    return { name, status: "ok", message: `Installed (${deps[name]})` };
  }
  return {
    name,
    status: "error",
    message: missingMessage,
    fix: getInstallCommand(info.packageManager, [name]),
  };
}

export function checkConfiguration(info: ProjectInfo): CheckResult[] {
  const results: CheckResult[] = [];
  const pkg = readPackageJson(process.cwd());
  if (!pkg) {
    exitWithError("Failed to read package.json. Check that it contains valid JSON.");
  }
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };

  // Check 1: Runtime package installed
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

  // Check 2: Babel plugin or webpack loader installed
  // Vue and Svelte use built-in source tracking, so they don't need babel-jsx
  const needsBabelJsx =
    info.buildTool === "vite" && frameworkNeedsBabelJsx(info.framework);
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

  // Check 3: Build config has babel plugin / webpack loader
  if (info.configFile && fs.existsSync(info.configFile)) {
    const configContent = fs.readFileSync(info.configFile, "utf-8");

    // Only check for babel config if framework needs it (not Vue/Svelte)
    if (needsBabelJsx) {
      const reactV6 = info.framework === "react" && usesReactPluginV6();
      const hasLegacyBabel =
        configContent.includes("@locator/babel-jsx") ||
        configContent.includes("locator/babel-jsx");
      const hasRolldownBabel = configContent.includes("@rolldown/plugin-babel");

      if ((reactV6 && hasRolldownBabel) || (!reactV6 && hasLegacyBabel)) {
        results.push({
          name: `${info.configFile} babel plugin`,
          status: "ok",
          message: reactV6
            ? "Babel plugin configured (@rolldown/plugin-babel)"
            : "Babel plugin configured",
        });
      } else if (reactV6) {
        results.push({
          name: `${info.configFile} babel plugin`,
          status: "error",
          message: "@vitejs/plugin-react v6+ requires @rolldown/plugin-babel for source tracking",
          fix: "Run npx @treelocator/init to configure @rolldown/plugin-babel",
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

  // Check 4: Vite plugin or runtime import
  if (info.buildTool === "vite" && info.configFile && fs.existsSync(info.configFile)) {
    const configContent = fs.readFileSync(info.configFile, "utf-8");
    if (configContent.includes("@treelocator/vite")) {
      results.push({
        name: `${info.configFile} treelocator plugin`,
        status: "ok",
        message: "Vite plugin configured (auto-injects runtime)",
      });
    } else if (info.entryFile && fs.existsSync(info.entryFile)) {
      const entryContent = fs.readFileSync(info.entryFile, "utf-8");
      if (entryContent.includes("@treelocator/runtime")) {
        results.push({
          name: `${info.entryFile} runtime import`,
          status: "ok",
          message: "Runtime imported manually",
        });
      } else {
        results.push({
          name: `${info.configFile} treelocator plugin`,
          status: "warning",
          message: "Vite plugin not configured",
          fix: `Add treelocator() from @treelocator/vite to plugins, or import @treelocator/runtime in ${info.entryFile}`,
        });
      }
    }
  } else if (info.buildTool === "next") {
    const appDir = fs.existsSync("src/app") ? "src/app" : "app";
    const providerPath = path.join(appDir, "LocatorProvider.tsx");
    const pagesAppPath = fs.existsSync("src/pages/_app.tsx")
      ? "src/pages/_app.tsx"
      : fs.existsSync("pages/_app.tsx")
        ? "pages/_app.tsx"
        : null;

    if (fs.existsSync(providerPath)) {
      results.push({
        name: `${providerPath}`,
        status: "ok",
        message: "LocatorProvider configured",
      });
    } else if (pagesAppPath && fs.existsSync(pagesAppPath)) {
      const appContent = fs.readFileSync(pagesAppPath, "utf-8");
      if (appContent.includes("@treelocator/runtime")) {
        results.push({
          name: `${pagesAppPath} runtime import`,
          status: "ok",
          message: "Runtime imported",
        });
      } else {
        results.push({
          name: `${pagesAppPath} runtime import`,
          status: "warning",
          message: "Runtime not imported",
          fix: `Add setupLocatorUI import to ${pagesAppPath}`,
        });
      }
    } else if (info.entryFile?.includes("layout.")) {
      results.push({
        name: "Next.js runtime setup",
        status: "warning",
        message: "LocatorProvider not found",
        fix: "Run npx @treelocator/init to create LocatorProvider.tsx",
      });
    }
  }

  return results;
}

export function printCheckResults(results: CheckResult[]): boolean {
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

export function runCheck(info: ProjectInfo): never {
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
