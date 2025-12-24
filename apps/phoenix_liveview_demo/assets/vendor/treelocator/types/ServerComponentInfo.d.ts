/**
 * Represents a server-side component in the ancestry chain.
 * Used for Phoenix LiveView, Rails ViewComponents, Next.js RSC, etc.
 */
export interface ServerComponentInfo {
    /** Component name (e.g., "AppWeb.CoreComponents.button") or "@caller" for call site */
    name: string;
    /** File path (e.g., "lib/app_web/core_components.ex") */
    filePath: string;
    /** Line number in the source file */
    line: number;
    /** Type of server component annotation */
    type: "component" | "caller";
}
