import { Source } from "@locator/shared";
import { TreeNodeComponent } from "../../types/TreeNode";
import { AdapterObject, FullElementInfo } from "../adapterApi";
import { HtmlElementTreeNode } from "../HtmlElementTreeNode";

type SvelteLoc = {
  char: number;
  column: number;
  file: string;
  line: number;
};

type SvelteElement = HTMLElement & { __svelte_meta?: { loc: SvelteLoc } };

export function getElementInfo(found: SvelteElement): FullElementInfo | null {
  if (found.__svelte_meta) {
    const { loc } = found.__svelte_meta;
    return {
      thisElement: {
        box: found.getBoundingClientRect(),
        label: found.nodeName.toLowerCase(),
        link: {
          column: loc.column + 1,
          line: loc.line + 1,
          filePath: loc.file,
          projectPath: "",
        },
      },
      htmlElement: found,
      parentElements: [],
      componentBox: found.getBoundingClientRect(),
      componentsLabels: [],
    };
  }
  return null;
}

export class SvelteTreeNodeElement extends HtmlElementTreeNode {
  getSource(): Source | null {
    const element = this.element as SvelteElement;
    if (element.__svelte_meta) {
      const { loc } = element.__svelte_meta;
      return {
        fileName: loc.file,
        lineNumber: loc.line + 1,
        columnNumber: loc.column + 1,
      };
    }
    return null;
  }
  getComponent(): TreeNodeComponent | null {
    return null;
  }
}

const svelteAdapter: AdapterObject = {
  getElementInfo,
};

export default svelteAdapter;
