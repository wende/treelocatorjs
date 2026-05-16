import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { SourceMapGenerator } from "source-map";
import vitePluginRescript from "./index";

interface FixtureMapping {
  generated: { line: number; column: number };
  original: { line: number; column: number };
  source?: string;
}

function buildMap(file: string, mappings: FixtureMapping[]): object {
  const gen = new SourceMapGenerator({ file });
  for (const m of mappings) {
    gen.addMapping({
      source: m.source ?? file.replace(/\.js$/, ""),
      generated: m.generated,
      original: m.original,
    });
  }
  return JSON.parse(gen.toString());
}

interface SetupResult {
  dir: string;
  jsPath: string;
  mapPath: string;
  resPath: string;
}

function writeFixture(opts: {
  filename?: string;
  jsCode: string;
  mappings?: FixtureMapping[];
  includeMap?: boolean;
}): SetupResult {
  const filename = opts.filename ?? "Button.res.js";
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "vprt-"));
  const jsPath = path.join(dir, filename);
  const mapPath = jsPath + ".map";
  const resPath = jsPath.replace(/\.js$/, "");

  fs.writeFileSync(jsPath, opts.jsCode);

  if (opts.includeMap !== false) {
    const map = buildMap(
      filename,
      opts.mappings ?? [
        { generated: { line: 1, column: 0 }, original: { line: 1, column: 0 } },
      ]
    );
    fs.writeFileSync(mapPath, JSON.stringify(map));
  }

  return { dir, jsPath, mapPath, resPath };
}

interface PluginCtx {
  warn: (msg: string) => void;
}

function makeCtx(): PluginCtx & { warnings: string[] } {
  const warnings: string[] = [];
  return {
    warnings,
    warn(msg: string) {
      warnings.push(msg);
    },
  };
}

const cleanupDirs: string[] = [];
afterEach(() => {
  while (cleanupDirs.length) {
    const d = cleanupDirs.pop()!;
    try {
      fs.rmSync(d, { recursive: true, force: true });
    } catch {
      // ignore
    }
  }
});

function track(s: SetupResult): SetupResult {
  cleanupDirs.push(s.dir);
  return s;
}

describe("vitePluginRescript", () => {
  describe("file filtering", () => {
    it("is a no-op for .tsx files", async () => {
      const plugin: any = vitePluginRescript({ injectSource: true });
      const ctx = makeCtx();
      const result = await plugin.transform.call(
        ctx,
        "const x = <div />;",
        "/some/path/App.tsx"
      );
      expect(result).toBeNull();
    });

    it("is a no-op for .jsx files", async () => {
      const plugin: any = vitePluginRescript({ injectSource: true });
      const ctx = makeCtx();
      const result = await plugin.transform.call(
        ctx,
        "const x = <div />;",
        "/some/path/App.jsx"
      );
      expect(result).toBeNull();
    });

    it("is a no-op for .vue files", async () => {
      const plugin: any = vitePluginRescript({ injectSource: true });
      const ctx = makeCtx();
      const result = await plugin.transform.call(
        ctx,
        "<template></template>",
        "/some/path/App.vue"
      );
      expect(result).toBeNull();
    });

    it("strips query strings before checking the suffix", async () => {
      const plugin: any = vitePluginRescript({ injectSource: true });
      const ctx = makeCtx();
      const result = await plugin.transform.call(
        ctx,
        "const x = 1;",
        "/some/path/App.tsx?vue&type=script"
      );
      expect(result).toBeNull();
    });
  });

  describe("missing source map", () => {
    it("warns once and returns null when no .map exists", async () => {
      const fixture = track(
        writeFixture({
          jsCode: "const x = 1;\n",
          includeMap: false,
        })
      );
      const plugin: any = vitePluginRescript({ injectSource: true });
      const ctx = makeCtx();

      const r1 = await plugin.transform.call(ctx, "const x = 1;\n", fixture.jsPath);
      const r2 = await plugin.transform.call(ctx, "const x = 1;\n", fixture.jsPath);

      expect(r1).toBeNull();
      expect(r2).toBeNull();
      expect(ctx.warnings).toHaveLength(1);
      expect(ctx.warnings[0]).toContain("no source map");
    });

    it("does not throw when the source map is malformed", async () => {
      const fixture = track(
        writeFixture({ jsCode: "const x = 1;\n", includeMap: false })
      );
      fs.writeFileSync(fixture.mapPath, "{not valid json");
      const plugin: any = vitePluginRescript({ injectSource: true });
      const ctx = makeCtx();
      const result = await plugin.transform.call(
        ctx,
        "const x = 1;\n",
        fixture.jsPath
      );
      expect(result).toBeNull();
    });
  });

  describe("__source injection", () => {
    it("injects __source pointing at the remapped .res location", async () => {
      const code = `let make = (props) => <div />;\n`;
      // `<div` starts at line 1 col 22 in the JS. Map it back to line 5 col 2.
      const fixture = track(
        writeFixture({
          jsCode: code,
          mappings: [
            {
              generated: { line: 1, column: 0 },
              original: { line: 1, column: 0 },
            },
            {
              generated: { line: 1, column: 22 },
              original: { line: 5, column: 2 },
            },
          ],
        })
      );
      const plugin: any = vitePluginRescript({ injectSource: true });
      const ctx = makeCtx();
      const result = await plugin.transform.call(ctx, code, fixture.jsPath);

      expect(result).not.toBeNull();
      expect(result.code).toContain("__source");
      expect(result.code).toMatch(/lineNumber:\s*5/);

      const expectedAbs = path
        .resolve(fixture.dir, "Button.res")
        .split(path.sep)
        .join("/");
      expect(result.code).toContain(`"${expectedAbs}"`);
    });

    it("emits an absolute filename even when source map paths are relative", async () => {
      const code = `let make = () => <span />;\n`;
      const fixture = track(
        writeFixture({
          jsCode: code,
          mappings: [
            {
              generated: { line: 1, column: 17 },
              original: { line: 2, column: 0 },
              // Relative path with .. segments to mimic real ReScript output
              source: "./Button.res",
            },
          ],
        })
      );
      const plugin: any = vitePluginRescript({ injectSource: true });
      const ctx = makeCtx();
      const result = await plugin.transform.call(ctx, code, fixture.jsPath);

      expect(result).not.toBeNull();
      const expectedAbs = path
        .resolve(fixture.dir, "Button.res")
        .split(path.sep)
        .join("/");
      expect(result.code).toContain(expectedAbs);
      // The relative path itself must NOT appear as the fileName value.
      expect(result.code).not.toMatch(/fileName:\s*"\.\/Button\.res"/);
    });

    it("does not duplicate __source if one already exists", async () => {
      const code = `let make = () => <div __source={{fileName:"x",lineNumber:1,columnNumber:0}} />;\n`;
      const fixture = track(
        writeFixture({
          jsCode: code,
          mappings: [
            {
              generated: { line: 1, column: 17 },
              original: { line: 9, column: 0 },
            },
          ],
        })
      );
      const plugin: any = vitePluginRescript({ injectSource: true });
      const ctx = makeCtx();
      const result = await plugin.transform.call(ctx, code, fixture.jsPath);

      // __source already present + no make.displayName needed change → may be modified
      // due to displayName injection, but the original __source must be preserved
      // and we must not have inserted a second one for the same element.
      const text = result?.code ?? code;
      const matches = text.match(/__source/g) ?? [];
      expect(matches.length).toBe(1);
    });
  });

  describe("displayName injection", () => {
    it("appends make.displayName for the module name", async () => {
      const code = `let make = (props) => <div />;\n`;
      const fixture = track(writeFixture({ jsCode: code }));
      const plugin: any = vitePluginRescript({ injectSource: true });
      const ctx = makeCtx();
      const result = await plugin.transform.call(ctx, code, fixture.jsPath);

      expect(result).not.toBeNull();
      expect(result.code).toMatch(/make\.displayName\s*=\s*["']Button["']/);
    });

    it("uses the file basename as the module name", async () => {
      const code = `let make = (props) => <span />;\n`;
      const fixture = track(
        writeFixture({ filename: "GlassPanel.res.js", jsCode: code })
      );
      const plugin: any = vitePluginRescript({ injectSource: true });
      const ctx = makeCtx();
      const result = await plugin.transform.call(ctx, code, fixture.jsPath);

      expect(result?.code).toMatch(
        /make\.displayName\s*=\s*["']GlassPanel["']/
      );
    });

    it("does not inject displayName when none of the top-level vars is `make`", async () => {
      const code = `let other = (props) => <div />;\n`;
      const fixture = track(writeFixture({ jsCode: code }));
      const plugin: any = vitePluginRescript({ injectSource: true });
      const ctx = makeCtx();
      const result = await plugin.transform.call(ctx, code, fixture.jsPath);

      const text = result?.code ?? code;
      expect(text).not.toMatch(/displayName/);
    });

    it("does not double-assign displayName if one already exists", async () => {
      const code = `let make = (props) => <div />;\nmake.displayName = "Custom";\n`;
      const fixture = track(writeFixture({ jsCode: code }));
      const plugin: any = vitePluginRescript({ injectSource: true });
      const ctx = makeCtx();
      const result = await plugin.transform.call(ctx, code, fixture.jsPath);

      const text = result?.code ?? code;
      const matches = text.match(/displayName\s*=/g) ?? [];
      expect(matches.length).toBe(1);
      expect(text).toContain('"Custom"');
    });

    it("ignores non-top-level `make` declarations", async () => {
      const code = `function wrap() { let make = () => <div />; return make; }\n`;
      const fixture = track(writeFixture({ jsCode: code }));
      const plugin: any = vitePluginRescript({ injectSource: true });
      const ctx = makeCtx();
      const result = await plugin.transform.call(ctx, code, fixture.jsPath);

      const text = result?.code ?? code;
      // Inner `make` should not trigger top-level displayName assignment.
      expect(text).not.toMatch(/^make\.displayName/m);
    });
  });

  describe("development gating", () => {
    it("is a no-op when injectSource is false even for .res.js", async () => {
      const code = `let make = () => <div />;\n`;
      const fixture = track(writeFixture({ jsCode: code }));
      const plugin: any = vitePluginRescript({ injectSource: false });
      const ctx = makeCtx();
      const result = await plugin.transform.call(ctx, code, fixture.jsPath);
      expect(result).toBeNull();
    });

    it("respects vite serve mode by default (no explicit option)", async () => {
      const code = `let make = () => <div />;\n`;
      const fixture = track(writeFixture({ jsCode: code }));
      const plugin: any = vitePluginRescript();
      // Simulate `vite build`
      plugin.configResolved({ command: "build" } as any);
      const ctx = makeCtx();
      const buildResult = await plugin.transform.call(ctx, code, fixture.jsPath);
      expect(buildResult).toBeNull();

      // Simulate `vite serve` (development)
      plugin.configResolved({ command: "serve" } as any);
      const serveResult = await plugin.transform.call(ctx, code, fixture.jsPath);
      expect(serveResult).not.toBeNull();
      expect(serveResult.code).toContain("__source");
    });
  });

  describe("HMR cache invalidation", () => {
    it("clears the cached SourceMapConsumer when the .res file changes", async () => {
      const code = `let make = () => <div />;\n`;
      const fixture = track(writeFixture({ jsCode: code }));

      const plugin: any = vitePluginRescript({ injectSource: true });
      const ctx = makeCtx();

      // Prime the cache.
      const first = await plugin.transform.call(ctx, code, fixture.jsPath);
      expect(first).not.toBeNull();
      expect(first.code).toMatch(/lineNumber:\s*1/);

      // Replace the source map: same JS column 17 now maps to line 42.
      const newMap = buildMap("Button.res.js", [
        { generated: { line: 1, column: 17 }, original: { line: 42, column: 0 } },
      ]);
      fs.writeFileSync(fixture.mapPath, JSON.stringify(newMap));

      // Without invalidation, the old consumer is reused. Confirm that.
      const stale = await plugin.transform.call(ctx, code, fixture.jsPath);
      expect(stale.code).not.toMatch(/lineNumber:\s*42/);

      // Now signal HMR for the .res file.
      plugin.handleHotUpdate({ file: fixture.resPath });

      const fresh = await plugin.transform.call(ctx, code, fixture.jsPath);
      expect(fresh.code).toMatch(/lineNumber:\s*42/);
    });
  });
});
