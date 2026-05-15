// ReScript adapter — re-exports the React adapter.
//
// ReScript components compile to React.createElement / jsxDEV calls and
// produce React fibers, so the React adapter handles them natively. The
// companion @treelocator/vite-plugin-rescript package injects __source
// attributes into the generated JSX pointing at .res files, and applies
// `make.displayName = "ModuleName"` so the fiber reports a friendly name
// instead of the literal `make`.
//
// Importing this file is purely a convention for projects that want to
// be explicit about ReScript support; it has no runtime effect beyond
// what the React adapter already does.
import reactAdapter, { ReactTreeNodeElement } from "./react/reactAdapter";

export const ReScriptTreeNodeElement = ReactTreeNodeElement;

export default reactAdapter;
