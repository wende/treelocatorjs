#!/usr/bin/env node
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
declare function readPackageJson(dir: string): Record<string, any> | null;
declare function exitWithError(message: string): never;
declare function injectBabelPluginIntoVitePlugin(content: string, pluginNames: string[], babelConfig: string): string;
declare function detectPackageManager(): ProjectInfo["packageManager"];
declare function detectProject(): ProjectInfo;
declare function getInstallCommand(pm: ProjectInfo["packageManager"], packages: string[]): string;
declare function checkConfiguration(info: ProjectInfo): CheckResult[];

export { checkConfiguration, detectPackageManager, detectProject, exitWithError, getInstallCommand, injectBabelPluginIntoVitePlugin, readPackageJson };
