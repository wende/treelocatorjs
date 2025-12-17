import { ReactDevtoolsHook } from "@locator/shared";
import { FileStorage } from "./types/types";
import { LocatorJSAPI } from "./browserApi";

declare global {
  interface Window {
    __REACT_DEVTOOLS_GLOBAL_HOOK__: ReactDevtoolsHook;
    __LOCATOR_DATA__: { [filename: string]: FileStorage };
    /**
     * LocatorJS Browser API
     *
     * Provides programmatic access to component ancestry information.
     * Works with browser automation tools like Playwright, Puppeteer, Selenium, etc.
     *
     * @example
     * // In Playwright
     * const path = await page.evaluate(() => {
     *   return window.__locatorjs__.getPath('button.submit');
     * });
     * console.log(path);
     *
     * @example
     * // Get raw ancestry data
     * const ancestry = await page.evaluate(() => {
     *   const element = document.querySelector('button.submit');
     *   return window.__locatorjs__.getAncestry(element);
     * });
     */
    __locatorjs__: LocatorJSAPI;
  }
}
