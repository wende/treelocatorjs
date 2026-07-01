import { AncestryItem } from "./formatAncestryChain";
import { isLocatorsOwnElement } from "./isLocatorsOwnElement";

const DEFAULT_MAX_DEPTH = 8;
const DEFAULT_MAX_NODES = 500;
const MAX_ALLOWED_DEPTH = 50;
const MAX_ALLOWED_NODES = 5_000;
const TEXT_LIMIT = 120;

export interface SourceAwareTreeOptions {
  selector?: string;
  maxDepth?: number;
  maxNodes?: number;
  includeHidden?: boolean;
  includeText?: boolean;
}

export interface SourceAwareTreeRect {
  x: number;
  y: number;
  width: number;
  height: number;
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface SourceAwareTreeNode {
  tag: string;
  role?: string;
  name?: string;
  text?: string;
  id?: string;
  classes?: string[];
  rect: SourceAwareTreeRect;
  visible: boolean;
  component?: string;
  file?: string;
  line?: number;
  ancestry: AncestryItem[];
  children: SourceAwareTreeNode[];
}

export interface SourceAwareTreeResult {
  root: SourceAwareTreeNode;
  nodeCount: number;
  truncated: boolean;
  options: Required<Omit<SourceAwareTreeOptions, "selector">> & {
    selector?: string;
  };
}

export type AncestryResolver = (
  element: HTMLElement
) => Promise<AncestryItem[] | null>;

function clampInteger(
  value: number | undefined,
  fallback: number,
  min: number,
  max: number
): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(value)));
}

function normalizeOptions(
  options?: SourceAwareTreeOptions
): SourceAwareTreeResult["options"] {
  return {
    selector: options?.selector,
    maxDepth: clampInteger(
      options?.maxDepth,
      DEFAULT_MAX_DEPTH,
      0,
      MAX_ALLOWED_DEPTH
    ),
    maxNodes: clampInteger(
      options?.maxNodes,
      DEFAULT_MAX_NODES,
      1,
      MAX_ALLOWED_NODES
    ),
    includeHidden: options?.includeHidden === true,
    includeText: options?.includeText !== false,
  };
}

function truncate(raw: string | null | undefined): string | undefined {
  if (!raw) return undefined;
  const normalized = raw.replace(/\s+/g, " ").trim();
  if (!normalized) return undefined;
  return normalized.length > TEXT_LIMIT
    ? `${normalized.slice(0, TEXT_LIMIT - 3)}...`
    : normalized;
}

function getDirectText(element: Element): string | undefined {
  const parts: string[] = [];
  element.childNodes.forEach((child) => {
    if (child.nodeType === Node.TEXT_NODE) {
      parts.push(child.textContent || "");
    }
  });

  const direct = truncate(parts.join(" "));
  if (direct) return direct;
  if (element.children.length === 0) return truncate(element.textContent);
  return undefined;
}

function getLabelledByText(element: Element): string | undefined {
  const labelledBy = element.getAttribute("aria-labelledby");
  if (!labelledBy) return undefined;

  const parts = labelledBy
    .split(/\s+/)
    .map((id) => element.ownerDocument.getElementById(id)?.textContent || "")
    .filter(Boolean);

  return truncate(parts.join(" "));
}

function getNativeRole(element: Element): string | undefined {
  const tag = element.tagName.toLowerCase();

  if (tag === "button") return "button";
  if (tag === "a" && element.hasAttribute("href")) return "link";
  if (tag === "textarea") return "textbox";
  if (tag === "select") return "combobox";
  if (tag === "nav") return "navigation";
  if (tag === "main") return "main";
  if (tag === "form") return "form";
  if (tag === "ul" || tag === "ol") return "list";
  if (tag === "li") return "listitem";
  if (tag === "table") return "table";
  if (tag === "tr") return "row";
  if (tag === "th") return "columnheader";
  if (tag === "td") return "cell";
  if (tag === "img") return "img";
  if (tag === "dialog") return "dialog";
  if (tag === "svg") return "img";
  if (/^h[1-6]$/.test(tag)) return "heading";

  if (tag === "input") {
    const type = (element.getAttribute("type") || "text").toLowerCase();
    if (type === "checkbox") return "checkbox";
    if (type === "radio") return "radio";
    if (type === "range") return "slider";
    if (type === "submit" || type === "button" || type === "reset") {
      return "button";
    }
    return "textbox";
  }

  return undefined;
}

function getRole(element: Element): string | undefined {
  return truncate(element.getAttribute("role")) || getNativeRole(element);
}

function shouldUseDescendantTextForName(element: Element): boolean {
  const tag = element.tagName.toLowerCase();
  return (
    tag === "button" ||
    tag === "a" ||
    tag === "label" ||
    tag === "summary" ||
    tag === "li" ||
    tag === "td" ||
    tag === "th" ||
    /^h[1-6]$/.test(tag)
  );
}

function getAccessibleName(element: Element): string | undefined {
  const ariaLabel = truncate(element.getAttribute("aria-label"));
  if (ariaLabel) return ariaLabel;

  const labelledBy = getLabelledByText(element);
  if (labelledBy) return labelledBy;

  const alt = truncate(element.getAttribute("alt"));
  if (alt) return alt;

  const title = truncate(element.getAttribute("title"));
  if (title) return title;

  if (
    element instanceof HTMLInputElement ||
    element instanceof HTMLTextAreaElement ||
    element instanceof HTMLSelectElement
  ) {
    if (element instanceof HTMLInputElement && element.type === "password") {
      return undefined;
    }
    const value = truncate(element.value);
    if (value) return value;
  }

  const directText = getDirectText(element);
  if (directText) return directText;

  if (shouldUseDescendantTextForName(element)) {
    return truncate(element.textContent);
  }

  return undefined;
}

function getClasses(element: Element): string[] | undefined {
  const classes = Array.from(element.classList).filter(
    (className) => !className.startsWith("locatorjs-")
  );
  return classes.length > 0 ? classes : undefined;
}

function getRect(element: Element): SourceAwareTreeRect {
  const rect = element.getBoundingClientRect();
  return {
    x: rect.x,
    y: rect.y,
    width: rect.width,
    height: rect.height,
    top: rect.top,
    right: rect.right,
    bottom: rect.bottom,
    left: rect.left,
  };
}

function isVisibleElement(element: Element): boolean {
  if (element instanceof HTMLElement && element.hidden) return false;
  if (element.getAttribute("aria-hidden") === "true") return false;

  const style = getComputedStyle(element);
  if (style.display === "none" || style.visibility === "hidden") return false;
  if (Number.parseFloat(style.opacity || "1") <= 0) return false;

  const rect = element.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}

function getPrimarySource(ancestry: AncestryItem[]): {
  component?: string;
  file?: string;
  line?: number;
} {
  const item = ancestry[0];
  if (!item) return {};

  if (item.ownerComponents && item.ownerComponents.length > 0) {
    for (let i = item.ownerComponents.length - 1; i >= 0; i--) {
      const owner = item.ownerComponents[i]!;
      if (owner.name === "Anonymous") continue;
      return {
        component: owner.name,
        file: owner.filePath || item.filePath,
        line: owner.line ?? item.line,
      };
    }
  }

  if (item.componentName && item.componentName !== "Anonymous") {
    return {
      component: item.componentName,
      file: item.filePath,
      line: item.line,
    };
  }

  const serverComponent =
    item.serverComponents?.find((component) => component.type === "component") ||
    item.serverComponents?.[0];
  if (serverComponent) {
    return {
      component: serverComponent.name,
      file: serverComponent.filePath,
      line: serverComponent.line,
    };
  }

  return {
    file: item.filePath,
    line: item.line,
  };
}

export async function buildSourceAwareTree(
  root: HTMLElement,
  rawOptions: SourceAwareTreeOptions | undefined,
  resolveAncestry: AncestryResolver
): Promise<SourceAwareTreeResult> {
  const options = normalizeOptions(rawOptions);
  let nodeCount = 0;
  let truncated = false;

  async function visit(
    element: Element,
    depth: number,
    isRoot: boolean
  ): Promise<SourceAwareTreeNode | null> {
    if (!(element instanceof HTMLElement) && !(element instanceof SVGElement)) {
      return null;
    }

    if (element instanceof HTMLElement && isLocatorsOwnElement(element)) {
      return null;
    }

    if (nodeCount >= options.maxNodes) {
      truncated = true;
      return null;
    }

    const visible = isVisibleElement(element);
    if (!options.includeHidden && !visible && !isRoot) {
      return null;
    }

    const ancestry =
      element instanceof HTMLElement
        ? (await resolveAncestry(element)) || []
        : [];
    const source = getPrimarySource(ancestry);
    const text = options.includeText ? getDirectText(element) : undefined;
    const children: SourceAwareTreeNode[] = [];

    nodeCount += 1;

    if (depth >= options.maxDepth) {
      if (element.children.length > 0) truncated = true;
    } else {
      for (let i = 0; i < element.children.length; i++) {
        if (nodeCount >= options.maxNodes) {
          truncated = true;
          break;
        }
        const child = await visit(element.children[i]!, depth + 1, false);
        if (child) children.push(child);
      }
    }

    return {
      tag: element.tagName.toLowerCase(),
      role: getRole(element),
      name: getAccessibleName(element),
      text,
      id: element.id || undefined,
      classes: getClasses(element),
      rect: getRect(element),
      visible,
      component: source.component,
      file: source.file,
      line: source.line,
      ancestry,
      children,
    };
  }

  const treeRoot = await visit(root, 0, true);
  if (!treeRoot) {
    throw new Error("Failed to build source-aware tree for root element");
  }

  return {
    root: treeRoot,
    nodeCount,
    truncated,
    options,
  };
}
