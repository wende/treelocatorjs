#!/usr/bin/env node

// src/index.ts
import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import prompts from "prompts";
import pc from "picocolors";
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
    console.error(pc.red("No package.json found. Run this from your project root."));
    process.exit(1);
  }
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
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
function getInstallCommand(pm, packages) {
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
function updateViteConfig(configFile, framework) {
  let content = fs.readFileSync(configFile, "utf-8");
  if (content.includes("@locator/babel-jsx")) {
    console.log(pc.yellow("TreeLocatorJS babel plugin already configured in vite.config"));
    return;
  }
  const babelConfig = `babel: {
        plugins: [
          ["@locator/babel-jsx/dist", { env: "development" }],
        ],
      }`;
  if (framework === "react") {
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
      content = content.replace(
        /react\(\s*\{/,
        `react({
      ${babelConfig},`
      );
    }
  }
  if (framework === "solid") {
    const solidPluginRegex = /solidPlugin\(\s*\)/;
    const solidPluginWithOptionsRegex = /solidPlugin\(\s*\{/;
    if (solidPluginRegex.test(content)) {
      content = content.replace(
        solidPluginRegex,
        `solidPlugin({
      ${babelConfig},
    })`
      );
    } else if (solidPluginWithOptionsRegex.test(content)) {
      content = content.replace(
        /solidPlugin\(\s*\{/,
        `solidPlugin({
      ${babelConfig},`
      );
    }
  }
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
function addRuntimeImport(entryFile, isNextApp) {
  let content = fs.readFileSync(entryFile, "utf-8");
  if (content.includes("@treelocator/runtime")) {
    console.log(pc.yellow("TreeLocatorJS runtime already imported"));
    return;
  }
  const importLine = `import setupLocatorUI from "@treelocator/runtime";
`;
  const setupCall = isNextApp ? "" : `
if (import.meta.env.DEV) {
  setupLocatorUI();
}
`;
  if (isNextApp) {
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
async function main() {
  console.log(pc.bold(pc.cyan("\n  TreeLocatorJS Setup Wizard\n")));
  const info = detectProject();
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
  const packages = ["@treelocator/runtime"];
  if (info.buildTool === "vite") {
    packages.push("@locator/babel-jsx");
  } else if (info.buildTool === "next") {
    packages.push("@locator/webpack-loader");
  }
  console.log(pc.dim(`
Installing ${packages.join(", ")}...`));
  const installCmd = getInstallCommand(info.packageManager, packages);
  try {
    execSync(installCmd, { stdio: "inherit" });
  } catch {
    console.error(pc.red("Failed to install packages."));
    process.exit(1);
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
  if (info.entryFile) {
    console.log(pc.dim(`
Updating ${info.entryFile}...`));
    const isNextApp = info.entryFile.startsWith("app/");
    addRuntimeImport(info.entryFile, isNextApp);
  }
  console.log(pc.bold(pc.green("\nTreeLocatorJS installed successfully!")));
  console.log(pc.dim("\nUsage: Hold Alt and click any component to copy its ancestry.\n"));
}
main().catch(console.error);
