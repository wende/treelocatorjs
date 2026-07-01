/**
 * Source-file transforms: config and entry-file edits applied by the wizard.
 * All functions are pure string→string where possible; file IO lives in the
 * update* wrappers.
 */

import fs from "fs";
import path from "path";
import pc from "picocolors";
import { frameworkNeedsBabelJsx, usesReactPluginV6 } from "./detect.js";

/**
 * Insert an import statement after the last existing import (or a preferred
 * anchor import when the predicate matches one). Prepends the import when the
 * file has none.
 */
function insertImportAfterLast(
  content: string,
  importLine: string,
  preferAnchor?: (line: string) => boolean
): string {
  const importMatches = content.match(/^import .+;?\s*$/gm);
  if (importMatches?.length) {
    const anchor =
      (preferAnchor && importMatches.find(preferAnchor)) ??
      importMatches[importMatches.length - 1]!;
    return content.replace(anchor, `${anchor}\n${importLine}`);
  }
  return `${importLine}\n${content}`;
}

export function addRolldownBabelPlugin(content: string): string {
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
    content = content.replace(/react\(\{[\s\S]*?\}\)/, (match) => `${match},\n    ${babelCall}`);
  } else if (content.includes("react()")) {
    content = content.replace("react()", `react(),\n    ${babelCall}`);
  }

  return content;
}

export function addTreelocatorVitePlugin(content: string): string {
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
  const updatedPlugins = pluginsBody.length
    ? `${pluginsBody}, treelocator()`
    : "treelocator()";

  return content.slice(0, start) + updatedPlugins + content.slice(end);
}

export function injectBabelPluginIntoVitePlugin(
  content: string,
  pluginNames: string[],
  babelConfig: string
): string {
  for (const pluginName of pluginNames) {
    const emptyCallRegex = new RegExp(`${pluginName}\\(\\s*\\)`);
    const withOptionsRegex = new RegExp(`${pluginName}\\(\\s*\\{`);

    if (emptyCallRegex.test(content)) {
      content = content.replace(
        emptyCallRegex,
        `${pluginName}({\n      ${babelConfig},\n    })`
      );
      return content;
    } else if (withOptionsRegex.test(content)) {
      content = content.replace(
        withOptionsRegex,
        `${pluginName}({\n      ${babelConfig},`
      );
      return content;
    }
  }
  return content;
}

/** Vite plugin call names to try per framework when injecting babel config. */
const VITE_PLUGIN_NAMES: Record<string, string[]> = {
  react: ["react"],
  solid: ["solid", "solidPlugin"],
  preact: ["preact"],
};

export function updateViteConfig(configFile: string, framework: string): void {
  let content = fs.readFileSync(configFile, "utf-8");
  let changed = false;

  if (!content.includes("@treelocator/vite")) {
    content = addTreelocatorVitePlugin(content);
    changed = true;
  }

  const needsBabel = frameworkNeedsBabelJsx(framework as any);
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
    console.log(pc.yellow("TreeLocatorJS already configured in vite.config"));
    return;
  }

  fs.writeFileSync(configFile, content);
  console.log(pc.green(`Updated ${configFile}`));
}

export function updateNextConfig(configFile: string): void {
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
  const configObjectPatterns = [
    /const nextConfig(?::\s*NextConfig)?\s*=\s*\{/,
    /module\.exports\s*=\s*\{/,
    /export default\s*\{/,
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
        `Could not auto-update ${configFile}. Add the webpack loader manually — see https://github.com/wende/treelocatorjs/blob/main/docs/NEXTJS-SETUP.md`
      )
    );
    return;
  }

  fs.writeFileSync(configFile, content);
  console.log(pc.green(`Updated ${configFile}`));
}

const LOCATOR_PROVIDER_SOURCE = `"use client";
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

export function setupNextAppRouter(): void {
  const appDir = fs.existsSync("src/app") ? "src/app" : fs.existsSync("app") ? "app" : null;
  if (!appDir) return;

  const providerPath = path.join(appDir, "LocatorProvider.tsx");
  if (!fs.existsSync(providerPath)) {
    fs.writeFileSync(providerPath, LOCATOR_PROVIDER_SOURCE);
    console.log(pc.green(`Created ${providerPath}`));
  }

  const layoutCandidates = ["layout.tsx", "layout.js", "layout.jsx"].map((file) =>
    path.join(appDir, file)
  );
  const layoutPath = layoutCandidates.find((file) => fs.existsSync(file));
  if (!layoutPath) return;

  let content = fs.readFileSync(layoutPath, "utf-8");
  if (content.includes("LocatorProvider")) {
    console.log(pc.yellow("LocatorProvider already wired in layout"));
    return;
  }

  content = insertImportAfterLast(
    content,
    `import { LocatorProvider } from "./LocatorProvider";`
  );

  content = content.replace(/\{children\}/g, "<LocatorProvider>{children}</LocatorProvider>");
  fs.writeFileSync(layoutPath, content);
  console.log(pc.green(`Updated ${layoutPath}`));
}

export function addPagesRouterRuntimeImport(entryFile: string): void {
  let content = fs.readFileSync(entryFile, "utf-8");

  if (content.includes("@treelocator/runtime")) {
    console.log(pc.yellow("TreeLocatorJS runtime already imported"));
    return;
  }

  const importLine = `import setupLocatorUI from "@treelocator/runtime";\n`;
  const setupCall = `\nif (process.env.NODE_ENV === "development") {\n  setupLocatorUI();\n}\n`;

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
