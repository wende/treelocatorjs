/**
 * Phoenix LiveView adapter for TreeLocatorJS.
 *
 * Parses server-side component information from Phoenix LiveView debug annotations.
 * Requires Phoenix LiveView v1.1+ with debug_heex_annotations: true in config.
 */
export { parsePhoenixServerComponents, findPrecedingPhoenixComments } from "./parsePhoenixComments";
export { detectPhoenix } from "./detectPhoenix";
export type { ServerComponentInfo } from "../../types/ServerComponentInfo";
export type { PhoenixCommentMatch } from "./types";
