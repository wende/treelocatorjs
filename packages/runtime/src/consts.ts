export const fontFamily = "Helvetica, sans-serif, Arial";

export type AdapterId = "react" | "jsx" | "svelte" | "vue";

/**
 * Data attributes injected by the babel/webpack plugins to track JSX source
 * locations, and the CSS selector that matches elements carrying them.
 */
export const LOCATORJS_ID_ATTR = "data-locatorjs-id";
export const LOCATORJS_PATH_ATTR = "data-locatorjs";
export const LOCATORJS_SELECTOR = `[${LOCATORJS_ID_ATTR}], [${LOCATORJS_PATH_ATTR}]`;
