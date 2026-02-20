import { Source } from "@locator/shared";

interface SourceMapSection {
  offset: { line: number; column: number };
  map: {
    version: number;
    sources: string[];
    mappings: string;
    sourcesContent?: (string | null)[];
  };
}

interface IndexedSourceMap {
  version: number;
  sections: SourceMapSection[];
}

interface BasicSourceMap {
  version: number;
  sources: string[];
  mappings: string;
  sourcesContent?: (string | null)[];
}

type SourceMap = IndexedSourceMap | BasicSourceMap;

// Cache: bundled script URL -> source map
const sourceMapCache = new Map<string, Promise<SourceMap | null>>();

/**
 * Parse the React 19 _debugStack Error.stack to extract the caller's location.
 *
 * Stack format:
 *   Error: react-stack-top-frame
 *       at exports.jsxDEV (http://localhost:3000/_next/.../chunk.js:410:33)
 *       at Home (http://localhost:3000/_next/.../chunk.js:8789:416)
 *       at Object.react_stack_bottom_frame (...)
 *
 * The second frame (after jsxDEV/jsx) is the component that created the element.
 */
export function parseDebugStack(
  stack: string
): { url: string; line: number; column: number } | null {
  const lines = stack.split("\n");

  // Find the component caller frame (skip react-stack-top-frame and jsx factory)
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]?.trim();
    if (!line) continue;

    // Skip react internal frames
    if (
      line.includes("react-stack-top-frame") ||
      line.includes("react_stack_bottom_frame")
    ) {
      continue;
    }

    // Skip JSX factory frames (jsxDEV, jsx, jsxs)
    if (
      line.includes("jsxDEV") ||
      line.includes("exports.jsx ") ||
      line.includes("exports.jsxs ")
    ) {
      continue;
    }

    // Parse "at Name (url:line:col)" or "at url:line:col"
    const match =
      line.match(/at\s+(?:\S+\s+)?\(?(https?:\/\/.+?):(\d+):(\d+)\)?/) ||
      line.match(/at\s+(https?:\/\/.+?):(\d+):(\d+)/);

    if (match && match[1] && match[2] && match[3]) {
      return {
        url: match[1],
        line: parseInt(match[2], 10),
        column: parseInt(match[3], 10),
      };
    }
  }

  return null;
}

async function fetchSourceMap(scriptUrl: string): Promise<SourceMap | null> {
  if (sourceMapCache.has(scriptUrl)) {
    return sourceMapCache.get(scriptUrl)!;
  }

  const promise = (async () => {
    try {
      // Fetch the script to find sourceMappingURL
      const scriptResp = await fetch(scriptUrl);
      if (!scriptResp.ok) return null;

      const scriptText = await scriptResp.text();
      const match = scriptText.match(
        /\/\/[#@]\s*sourceMappingURL=(.+?)(?:\s|$)/
      );
      if (!match || !match[1]) return null;

      // Resolve the source map URL relative to the script URL
      let mapUrl = match[1];
      if (!mapUrl.startsWith("http")) {
        const base = scriptUrl.substring(0, scriptUrl.lastIndexOf("/") + 1);
        mapUrl = base + mapUrl;
      }

      const mapResp = await fetch(mapUrl);
      if (!mapResp.ok) return null;

      return (await mapResp.json()) as SourceMap;
    } catch {
      return null;
    }
  })();

  sourceMapCache.set(scriptUrl, promise);
  return promise;
}

// Decode a single VLQ value from a mappings string, returns [value, charsConsumed]
const VLQ_BASE_SHIFT = 5;
const VLQ_BASE = 1 << VLQ_BASE_SHIFT; // 32
const VLQ_BASE_MASK = VLQ_BASE - 1; // 31
const VLQ_CONTINUATION_BIT = VLQ_BASE; // 32
const BASE64_CHARS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
const base64Map = new Map<string, number>();
for (let i = 0; i < BASE64_CHARS.length; i++) {
  base64Map.set(BASE64_CHARS[i]!, i);
}

function decodeVLQ(str: string, index: number): [number, number] {
  let result = 0;
  let shift = 0;
  let continuation: boolean;
  let i = index;

  do {
    const char = str[i];
    if (!char) return [0, i];
    const digit = base64Map.get(char);
    if (digit === undefined) return [0, i];
    i++;
    continuation = (digit & VLQ_CONTINUATION_BIT) !== 0;
    result += (digit & VLQ_BASE_MASK) << shift;
    shift += VLQ_BASE_SHIFT;
  } while (continuation);

  // Convert from VLQ signed
  const isNegative = (result & 1) === 1;
  result >>= 1;
  return [isNegative ? -result : result, i];
}

/**
 * Find the original source location for a generated line/column in a basic source map.
 */
function resolveInBasicMap(
  map: BasicSourceMap,
  targetLine: number,
  targetColumn: number
): Source | null {
  const mappings = map.mappings;
  if (!mappings) return null;

  let generatedLine = 1;
  let generatedColumn = 0;
  let sourceIndex = 0;
  let sourceLine = 0;
  let sourceColumn = 0;

  let bestSource: Source | null = null;
  let i = 0;

  while (i < mappings.length) {
    const char = mappings[i];

    if (char === ";") {
      generatedLine++;
      generatedColumn = 0;
      i++;
      continue;
    }

    if (char === ",") {
      i++;
      continue;
    }

    // Decode segment
    let colDelta: number;
    [colDelta, i] = decodeVLQ(mappings, i);
    generatedColumn += colDelta;

    // Check if there's source info (segments can be 1, 4, or 5 fields)
    if (i < mappings.length && mappings[i] !== "," && mappings[i] !== ";") {
      let srcDelta: number, lineDelta: number, srcColDelta: number;
      [srcDelta, i] = decodeVLQ(mappings, i);
      sourceIndex += srcDelta;
      [lineDelta, i] = decodeVLQ(mappings, i);
      sourceLine += lineDelta;
      [srcColDelta, i] = decodeVLQ(mappings, i);
      sourceColumn += srcColDelta;

      // Skip optional name index
      if (i < mappings.length && mappings[i] !== "," && mappings[i] !== ";") {
        [, i] = decodeVLQ(mappings, i);
      }

      // Check if this mapping is at or before our target
      if (
        generatedLine === targetLine &&
        generatedColumn <= targetColumn
      ) {
        const fileName = map.sources[sourceIndex];
        if (fileName) {
          bestSource = {
            fileName: cleanSourcePath(fileName),
            lineNumber: sourceLine + 1, // source maps are 0-indexed
            columnNumber: sourceColumn,
          };
        }
      }

      // If we've passed the target line, we can stop
      if (generatedLine > targetLine) {
        break;
      }
    }
  }

  return bestSource;
}

/**
 * Clean up source file paths from source maps.
 * Strips file:// protocol and common project root prefixes.
 */
function cleanSourcePath(filePath: string): string {
  // Strip file:// protocol
  let cleaned = filePath.replace(/^file:\/\//, "");

  // Strip webpack/turbopack internal prefixes
  cleaned = cleaned.replace(/^\[project\]\//, "");
  cleaned = cleaned.replace(/^webpack:\/\/[^/]*\//, "");

  return cleaned;
}

/**
 * Resolve a bundled location to its original source using source maps.
 * Returns null if resolution fails.
 */
export async function resolveSourceLocation(
  url: string,
  line: number,
  column: number
): Promise<Source | null> {
  const sourceMap = await fetchSourceMap(url);
  if (!sourceMap) return null;

  // Handle indexed/sectioned source maps (used by Turbopack)
  if ("sections" in sourceMap && sourceMap.sections) {
    const sections = sourceMap.sections;

    // Find the section that contains our target line
    let targetSection: SourceMapSection | null = null;
    for (let i = sections.length - 1; i >= 0; i--) {
      const section = sections[i];
      if (!section) continue;
      if (section.offset.line < line) {
        targetSection = section;
        break;
      }
      if (section.offset.line === line && section.offset.column <= column) {
        targetSection = section;
        break;
      }
    }

    if (!targetSection) return null;

    // Resolve within the section's map (adjust line/column relative to section offset)
    const relLine = line - targetSection.offset.line;
    const relCol =
      line === targetSection.offset.line
        ? column - targetSection.offset.column
        : column;

    return resolveInBasicMap(
      targetSection.map as BasicSourceMap,
      relLine,
      relCol
    );
  }

  // Handle basic source maps
  return resolveInBasicMap(sourceMap as BasicSourceMap, line, column);
}

/**
 * Given a React 19 fiber's _debugStack, resolve the source location
 * by parsing the stack trace and looking up source maps.
 */
export async function resolveSourceFromDebugStack(
  debugStack: { stack?: string }
): Promise<Source | null> {
  if (!debugStack?.stack) return null;

  const parsed = parseDebugStack(debugStack.stack);
  if (!parsed) return null;

  return resolveSourceLocation(parsed.url, parsed.line, parsed.column);
}
