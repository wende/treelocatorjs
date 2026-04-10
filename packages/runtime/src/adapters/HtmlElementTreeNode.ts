import { Source } from "@locator/shared";
import { getReferenceId } from "../functions/getReferenceId";
import nonNullable from "../functions/nonNullable";
import { TreeNode, TreeNodeComponent } from "../types/TreeNode";
import { SimpleDOMRect } from "../types/types";

type HtmlElementTreeNodeConstructor = new (
  element: HTMLElement | SVGElement
) => HtmlElementTreeNode;

export class HtmlElementTreeNode implements TreeNode {
  type: "element" = "element";
  element: HTMLElement | SVGElement;
  name: string;
  uniqueId: string;
  constructor(element: HTMLElement | SVGElement) {
    this.element = element;
    this.name = element.nodeName.toLowerCase();
    this.uniqueId = String(getReferenceId(element));
  }
  getBox(): SimpleDOMRect | null {
    return this.element.getBoundingClientRect();
  }
  getElement(): Element | Text {
    return this.element;
  }
  getChildren(): TreeNode[] {
    const children = Array.from(this.element.children);
    const Ctor = this.constructor as HtmlElementTreeNodeConstructor;
    return children
      .map((child) => {
        if (child instanceof HTMLElement || child instanceof SVGElement) {
          return new Ctor(child);
        } else {
          return null;
        }
      })
      .filter(nonNullable);
  }
  getParent(): TreeNode | null {
    if (this.element.parentElement) {
      const Ctor = this.constructor as HtmlElementTreeNodeConstructor;
      return new Ctor(this.element.parentElement);
    } else {
      return null;
    }
  }
  getSource(): Source | null {
    throw new Error("Method not implemented.");
  }
  getComponent(): TreeNodeComponent | null {
    throw new Error("Method not implemented.");
  }
  getOwnerComponents(): TreeNodeComponent[] {
    return [];
  }
}
