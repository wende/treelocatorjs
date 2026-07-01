#!/usr/bin/env node
interface ProjectInfo {
    packageManager: "npm" | "yarn" | "pnpm" | "bun";
    buildTool: "vite" | "next" | "webpack" | "unknown";
    framework: "react" | "vue" | "svelte" | "preact" | "solid" | "unknown";
    hasTypeScript: boolean;
    configFile: string | null;
    entryFile: string | null;
}
declare function usesReactPluginV6(): boolean;
declare function detectPackageManager(): ProjectInfo["packageManager"];
declare function detectProject(): ProjectInfo;
declare function getInstallCommand(pm: ProjectInfo["packageManager"], packages: string[], useLocal?: boolean): string;

/**
 * Source-file transforms: config and entry-file edits applied by the wizard.
 * All functions are pure string→string where possible; file IO lives in the
 * update* wrappers.
 */
declare function addRolldownBabelPlugin(content: string): string;
declare function addTreelocatorVitePlugin(content: string): string;
declare function injectBabelPluginIntoVitePlugin(content: string, pluginNames: string[], babelConfig: string): string;

/**
 * `--check` mode: verify an existing TreeLocatorJS setup without changing it.
 */

interface CheckResult {
    name: string;
    status: "ok" | "warning" | "error";
    message: string;
    fix?: string;
}
declare function checkConfiguration(info: ProjectInfo): CheckResult[];

declare function readPackageJson(dir: string): Record<string, any> | null;
declare function exitWithError(message: string): never;

export { type CheckResult, type ProjectInfo, addRolldownBabelPlugin, addTreelocatorVitePlugin, checkConfiguration, detectPackageManager, detectProject, exitWithError, getInstallCommand, injectBabelPluginIntoVitePlugin, readPackageJson, usesReactPluginV6 };
