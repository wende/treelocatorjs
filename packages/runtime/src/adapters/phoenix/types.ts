/**
 * Represents a parsed Phoenix LiveView debug annotation HTML comment.
 * Phoenix LiveView adds these comments when debug_heex_annotations: true is configured.
 */
export interface PhoenixCommentMatch {
  /** The actual HTML Comment node from the DOM */
  commentNode: Comment;
  /** Component name (e.g., "AppWeb.CoreComponents.button") or "@caller" */
  name: string;
  /** File path (e.g., "lib/app_web/core_components.ex") */
  filePath: string;
  /** Line number */
  line: number;
  /** Type of annotation */
  type: "component" | "caller";
}
