/**
 * Reasons a comments use case fails to find what the path names. Shared by every use case of this
 * module; the value is what clients see, as the problem type `/problems/<value>`.
 */
export const CommentLookupError = {
  /** No document has the id in the path, or that document has no comment with the id. */
  NotFound: "not-found",
} as const;

/** One of the {@link CommentLookupError} values, for `Result` error types. */
export type CommentLookupError = (typeof CommentLookupError)[keyof typeof CommentLookupError];
