/**
 * Reasons the comment aggregate refuses a new comment. Code names a reason by its key; the value is
 * what clients see, as the problem type `/problems/<value>`, so changing a value is an API change.
 */
export const CommentError = {
  /** The text is empty, only whitespace, or longer than the comment's maximum length. */
  InvalidBody: "invalid-comment-body",
} as const;

/** One of the {@link CommentError} values, for `Result` error types. */
export type CommentError = (typeof CommentError)[keyof typeof CommentError];
