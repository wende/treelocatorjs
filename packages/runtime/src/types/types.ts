import { Target } from "@locator/shared";

export type Source = {
  fileName: string;
  lineNumber: number;
  columnNumber?: number;
  projectPath?: string;
};

export type SimpleDOMRect = {
  height: number;
  width: number;
  x: number;
  y: number;
};

export type Targets = { [k: string]: Target | string };

export type LinkProps = {
  filePath: string;
  projectPath: string;
  line: number;
  column: number;
};
