import { describe, expect, test, vi } from "vitest";
import { buildSourceAwareTree } from "./sourceAwareTree";
import type { AncestryItem } from "./formatAncestryChain";

describe("buildSourceAwareTree", () => {
  test("degrades to empty ancestry when resolveAncestry rejects", async () => {
    document.body.innerHTML = `<main><button>Save</button></main>`;
    const resolver = vi.fn().mockRejectedValue(new Error("source-map boom"));

    const result = await buildSourceAwareTree(
      document.body,
      { includeHidden: true },
      resolver
    );

    // A failing source-map lookup must not abort the whole build.
    expect(result).not.toBeNull();
    expect(resolver).toHaveBeenCalled();
    expect(result?.root.tag).toBe("body");

    const button = result?.root.children[0]?.children[0];
    expect(button?.tag).toBe("button");
    expect(button?.ancestry).toEqual([]);
    expect(button?.component).toBeUndefined();
    expect(button?.file).toBeUndefined();
  });

  test("populates component/file/line from resolved ancestry", async () => {
    document.body.innerHTML = `<main><button>Save</button></main>`;
    const ancestry: AncestryItem[] = [
      {
        elementName: "button",
        componentName: "SaveButton",
        filePath: "src/SaveButton.tsx",
        line: 12,
      } as AncestryItem,
    ];
    const resolver = vi
      .fn()
      .mockImplementation((el: HTMLElement) =>
        Promise.resolve(el.tagName === "BUTTON" ? ancestry : [])
      );

    const result = await buildSourceAwareTree(
      document.body,
      { includeHidden: true },
      resolver
    );

    const button = result?.root.children[0]?.children[0];
    expect(button?.component).toBe("SaveButton");
    expect(button?.file).toBe("src/SaveButton.tsx");
    expect(button?.line).toBe(12);
  });
});
