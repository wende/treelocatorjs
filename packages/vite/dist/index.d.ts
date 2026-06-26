import { Plugin } from 'vite';

/**
 * Vite plugin for TreeLocatorJS.
 *
 * In dev mode, injects the runtime setup so you don't need to import
 * @treelocator/runtime in your entry file. Pair with @locator/babel-jsx
 * in your framework plugin for React/Solid/Preact projects.
 */
declare function treelocator(): Plugin;

export { treelocator as default };
