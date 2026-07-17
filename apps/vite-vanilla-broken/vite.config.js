import { defineConfig } from "vite";

// Intentionally minimal: NO framework plugin and NO @locator/babel-jsx.
// This app is hand-written static HTML + imperative DOM code, so there are no
// JSX elements to transform and therefore no `data-locatorjs-id` source
// attributes. TreeLocator will not be able to resolve component ancestry here
// — this demo exists to exercise that "no component source" path.
export default defineConfig({});
