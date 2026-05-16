import type { Plugin } from "vite";
import * as fs from "node:fs";
import * as nodePath from "node:path";
import { parse } from "@babel/parser";
import _traverse from "@babel/traverse";
import _generate from "@babel/generator";
import * as t from "@babel/types";
import { SourceMapConsumer } from "source-map";

// Babel ships dual ESM/CJS where the CJS interop wraps the export under .default.
const traverse: typeof _traverse =
  ((_traverse as unknown) as { default?: typeof _traverse }).default ?? _traverse;
const generate: typeof _generate =
  ((_generate as unknown) as { default?: typeof _generate }).default ?? _generate;

export interface VitePluginRescriptOptions {
  /**
   * Force-enable __source injection regardless of Vite mode.
   * By default, injection only runs during `vite serve` (development).
   */
  injectSource?: boolean;
}

interface ConsumerEntry {
  consumer: SourceMapConsumer;
  jsDir: string;
}

interface TransformContext {
  warn(msg: string): void;
}

const RES_JS_SUFFIX = ".res.js";

/**
 * Vite plugin that injects __source attributes into JSX produced by ReScript
 * with `"jsx": { "preserve": true }`. The attributes point at the original
 * .res file (resolved via the .res.js.map source map) so React DevTools and
 * TreeLocatorJS can show the correct file/line for each component.
 *
 * Also appends `make.displayName = "ModuleName"` after the top-level
 * `let make = ...` so the React component name is the module name instead
 * of the literal `make`.
 */
export function vitePluginRescript(
  options: VitePluginRescriptOptions = {}
): Plugin {
  const consumerCache = new Map<string, ConsumerEntry>();
  const warnedNoMap = new Set<string>();
  let isDev = false;

  async function getConsumer(jsFilePath: string): Promise<ConsumerEntry | null> {
    const cached = consumerCache.get(jsFilePath);
    if (cached) return cached;

    const mapPath = jsFilePath + ".map";
    if (!fs.existsSync(mapPath)) return null;

    let rawMap: unknown;
    try {
      rawMap = JSON.parse(fs.readFileSync(mapPath, "utf-8"));
    } catch {
      return null;
    }

    const consumer = await new SourceMapConsumer(rawMap as never);
    const entry: ConsumerEntry = {
      consumer,
      jsDir: nodePath.dirname(jsFilePath),
    };
    consumerCache.set(jsFilePath, entry);
    return entry;
  }

  function invalidateJs(jsPath: string) {
    const entry = consumerCache.get(jsPath);
    if (entry) {
      entry.consumer.destroy();
      consumerCache.delete(jsPath);
    }
    warnedNoMap.delete(jsPath);
  }

  function invalidateRes(resPath: string) {
    // Drop any cached entry whose .res.js shares the same basename as the
    // changed .res. ReScript regenerates Foo.res.js + Foo.res.js.map together
    // on every recompile, so the cached SourceMapConsumer becomes stale.
    const baseName = nodePath.basename(resPath, ".res");
    for (const cachedPath of [...consumerCache.keys()]) {
      if (nodePath.basename(cachedPath, RES_JS_SUFFIX) === baseName) {
        invalidateJs(cachedPath);
      }
    }
  }

  return {
    name: "vite-plugin-rescript",
    enforce: "pre",

    configResolved(config) {
      isDev = config.command === "serve";
    },

    async transform(this: TransformContext, code: string, id: string) {
      const filePath = id.split("?")[0];
      if (!filePath.endsWith(RES_JS_SUFFIX)) return null;

      const shouldInject = options.injectSource ?? isDev;
      if (!shouldInject) return null;

      const entry = await getConsumer(filePath);
      if (!entry) {
        if (!warnedNoMap.has(filePath)) {
          warnedNoMap.add(filePath);
          this.warn(
            `vite-plugin-rescript: no source map (.map) found alongside ${filePath}. ` +
              `Make sure rescript.json sets "jsx": { "version": 4, "preserve": true } and that source maps are emitted.`
          );
        }
        return null;
      }

      const { consumer, jsDir } = entry;
      const moduleName = nodePath.basename(filePath, RES_JS_SUFFIX);

      let ast;
      try {
        ast = parse(code, {
          sourceType: "module",
          plugins: ["jsx"],
        });
      } catch {
        return null;
      }

      let modified = false;
      let hasMakeDeclaration = false;

      traverse(ast, {
        JSXOpeningElement(jsxPath) {
          const loc = jsxPath.node.loc;
          if (!loc) return;

          // Source maps are 1-based for line, 0-based for column — same as Babel.
          const original = consumer.originalPositionFor({
            line: loc.start.line,
            column: loc.start.column,
          });
          if (!original.source || original.line == null) return;

          const absoluteSource = nodePath
            .resolve(jsDir, original.source)
            .split(nodePath.sep)
            .join("/");

          const alreadyHasSource = jsxPath.node.attributes.some(
            (attr) =>
              t.isJSXAttribute(attr) &&
              t.isJSXIdentifier(attr.name) &&
              attr.name.name === "__source"
          );
          if (alreadyHasSource) return;

          jsxPath.node.attributes.push(
            t.jsxAttribute(
              t.jsxIdentifier("__source"),
              t.jsxExpressionContainer(
                t.objectExpression([
                  t.objectProperty(
                    t.identifier("fileName"),
                    t.stringLiteral(absoluteSource)
                  ),
                  t.objectProperty(
                    t.identifier("lineNumber"),
                    t.numericLiteral(original.line)
                  ),
                  t.objectProperty(
                    t.identifier("columnNumber"),
                    t.numericLiteral(original.column ?? 0)
                  ),
                ])
              )
            )
          );
          modified = true;
        },
        VariableDeclarator(varPath) {
          // Only consider top-level `let make = ...` (Program > VariableDeclaration > VariableDeclarator).
          const grandparent = varPath.parentPath?.parentPath;
          if (!grandparent || !grandparent.isProgram()) return;
          if (
            t.isIdentifier(varPath.node.id) &&
            varPath.node.id.name === "make"
          ) {
            hasMakeDeclaration = true;
          }
        },
      });

      if (hasMakeDeclaration && !hasDisplayNameAssignment(ast)) {
        const programBody = ast.program.body;
        for (let i = 0; i < programBody.length; i++) {
          const node = programBody[i];
          const isMakeDecl =
            t.isVariableDeclaration(node) &&
            node.declarations.some(
              (d) => t.isIdentifier(d.id) && d.id.name === "make"
            );
          if (isMakeDecl) {
            programBody.splice(
              i + 1,
              0,
              t.expressionStatement(
                t.assignmentExpression(
                  "=",
                  t.memberExpression(
                    t.identifier("make"),
                    t.identifier("displayName")
                  ),
                  t.stringLiteral(moduleName)
                )
              )
            );
            modified = true;
            break;
          }
        }
      }

      if (!modified) return null;

      const output = generate(ast, {
        retainLines: true,
        sourceMaps: true,
        sourceFileName: filePath,
      });

      return {
        code: output.code,
        map: output.map,
      };
    },

    handleHotUpdate({ file }) {
      if (file.endsWith(".res")) {
        invalidateRes(file);
      } else if (file.endsWith(RES_JS_SUFFIX)) {
        invalidateJs(file);
      } else if (file.endsWith(".res.js.map")) {
        invalidateJs(file.slice(0, -".map".length));
      }
    },
  };
}

function hasDisplayNameAssignment(ast: t.File): boolean {
  return ast.program.body.some((node) => {
    if (!t.isExpressionStatement(node)) return false;
    const expr = node.expression;
    if (!t.isAssignmentExpression(expr) || expr.operator !== "=") return false;
    if (!t.isMemberExpression(expr.left)) return false;
    return (
      t.isIdentifier(expr.left.object, { name: "make" }) &&
      t.isIdentifier(expr.left.property, { name: "displayName" })
    );
  });
}

export default vitePluginRescript;
