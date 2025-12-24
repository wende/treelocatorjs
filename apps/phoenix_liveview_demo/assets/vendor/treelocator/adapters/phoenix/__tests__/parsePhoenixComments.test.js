/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, beforeEach } from "vitest";
import { findPrecedingPhoenixComments, phoenixMatchesToServerComponents, parsePhoenixServerComponents } from "../parsePhoenixComments";
describe("parsePhoenixComments", () => {
  let container;
  beforeEach(() => {
    container = document.createElement("div");
  });
  describe("findPrecedingPhoenixComments", () => {
    it("parses @caller comment", () => {
      container.innerHTML = `
        <!-- @caller lib/app_web/home_live.ex:20 -->
        <header>Content</header>
      `;
      const header = container.querySelector("header");
      const matches = findPrecedingPhoenixComments(header);
      expect(matches).toHaveLength(1);
      expect(matches[0]).toMatchObject({
        name: "@caller",
        filePath: "lib/app_web/home_live.ex",
        line: 20,
        type: "caller"
      });
    });
    it("parses component comment", () => {
      container.innerHTML = `
        <!-- <AppWeb.CoreComponents.header> lib/app_web/core_components.ex:123 -->
        <header>Content</header>
      `;
      const header = container.querySelector("header");
      const matches = findPrecedingPhoenixComments(header);
      expect(matches).toHaveLength(1);
      expect(matches[0]).toMatchObject({
        name: "AppWeb.CoreComponents.header",
        filePath: "lib/app_web/core_components.ex",
        line: 123,
        type: "component"
      });
    });
    it("ignores closing tag comments", () => {
      container.innerHTML = `
        <!-- </AppWeb.CoreComponents.header> -->
        <header>Content</header>
      `;
      const header = container.querySelector("header");
      const matches = findPrecedingPhoenixComments(header);
      expect(matches).toHaveLength(0);
    });
    it("finds multiple preceding comments in correct order", () => {
      container.innerHTML = `
        <!-- @caller lib/app_web/home_live.ex:20 -->
        <!-- <AppWeb.CoreComponents.header> lib/app_web/core_components.ex:123 -->
        <header>Content</header>
      `;
      const header = container.querySelector("header");
      const matches = findPrecedingPhoenixComments(header);
      expect(matches).toHaveLength(2);
      // Should be ordered from outermost to innermost
      expect(matches[0].name).toBe("@caller");
      expect(matches[0].line).toBe(20);
      expect(matches[1].name).toBe("AppWeb.CoreComponents.header");
      expect(matches[1].line).toBe(123);
    });
    it("stops at non-comment element node", () => {
      container.innerHTML = `
        <div>Other element</div>
        <!-- <AppWeb.CoreComponents.header> lib/app_web/core_components.ex:123 -->
        <header>Content</header>
      `;
      const header = container.querySelector("header");
      const matches = findPrecedingPhoenixComments(header);

      // Should only find the comment between the div and header
      expect(matches).toHaveLength(1);
      expect(matches[0].name).toBe("AppWeb.CoreComponents.header");
    });
    it("skips whitespace text nodes", () => {
      container.innerHTML = `
        <!-- @caller lib/app_web/home_live.ex:20 -->

        <header>Content</header>
      `;
      const header = container.querySelector("header");
      const matches = findPrecedingPhoenixComments(header);

      // Should find the comment despite whitespace text node
      expect(matches).toHaveLength(1);
      expect(matches[0].name).toBe("@caller");
    });
    it("stops at non-whitespace text node", () => {
      container.innerHTML = `
        <!-- @caller lib/app_web/home_live.ex:20 -->
        Some text
        <header>Content</header>
      `;
      const header = container.querySelector("header");
      const matches = findPrecedingPhoenixComments(header);

      // Should stop at the text node, not finding the comment
      expect(matches).toHaveLength(0);
    });
    it("returns empty array if no preceding comments", () => {
      container.innerHTML = `<header>Content</header>`;
      const header = container.querySelector("header");
      const matches = findPrecedingPhoenixComments(header);
      expect(matches).toHaveLength(0);
    });
    it("ignores non-Phoenix comments", () => {
      container.innerHTML = `
        <!-- Regular HTML comment -->
        <header>Content</header>
      `;
      const header = container.querySelector("header");
      const matches = findPrecedingPhoenixComments(header);
      expect(matches).toHaveLength(0);
    });
    it("finds Phoenix comments and ignores non-Phoenix comments", () => {
      container.innerHTML = `
        <!-- Regular comment -->
        <!-- @caller lib/app_web/home_live.ex:20 -->
        <!-- Another regular comment -->
        <!-- <AppWeb.CoreComponents.header> lib/app_web/core_components.ex:123 -->
        <header>Content</header>
      `;
      const header = container.querySelector("header");
      const matches = findPrecedingPhoenixComments(header);

      // Should only find the 2 Phoenix comments
      expect(matches).toHaveLength(2);
      expect(matches[0].name).toBe("@caller");
      expect(matches[1].name).toBe("AppWeb.CoreComponents.header");
    });
  });
  describe("phoenixMatchesToServerComponents", () => {
    it("converts matches to ServerComponentInfo format", () => {
      container.innerHTML = `
        <!-- @caller lib/app_web/home_live.ex:20 -->
        <!-- <AppWeb.CoreComponents.button> lib/app_web/core_components.ex:456 -->
        <button>Click</button>
      `;
      const button = container.querySelector("button");
      const matches = findPrecedingPhoenixComments(button);
      const serverComponents = phoenixMatchesToServerComponents(matches);
      expect(serverComponents).toHaveLength(2);
      expect(serverComponents[0]).toEqual({
        name: "@caller",
        filePath: "lib/app_web/home_live.ex",
        line: 20,
        type: "caller"
      });
      expect(serverComponents[1]).toEqual({
        name: "AppWeb.CoreComponents.button",
        filePath: "lib/app_web/core_components.ex",
        line: 456,
        type: "component"
      });
    });
  });
  describe("parsePhoenixServerComponents", () => {
    it("returns ServerComponentInfo array when comments found", () => {
      container.innerHTML = `
        <!-- @caller lib/app_web/home_live.ex:48 -->
        <!-- <AppWeb.CoreComponents.button> lib/app_web/core_components.ex:456 -->
        <button data-phx-loc="458">Click Me</button>
      `;
      const button = container.querySelector("button");
      const result = parsePhoenixServerComponents(button);
      expect(result).not.toBeNull();
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        name: "@caller",
        filePath: "lib/app_web/home_live.ex",
        line: 48,
        type: "caller"
      });
      expect(result[1]).toEqual({
        name: "AppWeb.CoreComponents.button",
        filePath: "lib/app_web/core_components.ex",
        line: 456,
        type: "component"
      });
    });
    it("returns null when no comments found", () => {
      container.innerHTML = `<button>Click Me</button>`;
      const button = container.querySelector("button");
      const result = parsePhoenixServerComponents(button);
      expect(result).toBeNull();
    });
    it("handles nested structure with multiple components", () => {
      container.innerHTML = `
        <!-- @caller lib/app_web/home_live.ex:20 -->
        <!-- <AppWeb.CoreComponents.header> lib/app_web/core_components.ex:123 -->
        <header data-phx-loc="125" class="p-5">
          <!-- @caller lib/app_web/home_live.ex:48 -->
          <!-- <AppWeb.CoreComponents.button> lib/app_web/core_components.ex:456 -->
          <button data-phx-loc="458" class="px-2">Click</button>
        </header>
      `;
      const header = container.querySelector("header");
      const headerResult = parsePhoenixServerComponents(header);
      expect(headerResult).not.toBeNull();
      expect(headerResult).toHaveLength(2);
      expect(headerResult[0].name).toBe("@caller");
      expect(headerResult[0].line).toBe(20);
      expect(headerResult[1].name).toBe("AppWeb.CoreComponents.header");
      const button = container.querySelector("button");
      const buttonResult = parsePhoenixServerComponents(button);
      expect(buttonResult).not.toBeNull();
      expect(buttonResult).toHaveLength(2);
      expect(buttonResult[0].name).toBe("@caller");
      expect(buttonResult[0].line).toBe(48);
      expect(buttonResult[1].name).toBe("AppWeb.CoreComponents.button");
    });
  });
});