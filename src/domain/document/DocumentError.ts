/**
 * Reasons the document aggregate refuses a change. Code names a reason by its key; the value is what
 * clients see, as the problem type `/problems/<value>`, so changing a value is an API change.
 */
export const DocumentError = {
  /** The body is longer than the document's maximum length. */
  InvalidBody: "invalid-body",
  /** The caller's expected version is not the current one: someone else revised the document first. */
  VersionConflict: "version-conflict",
} as const;

/** One of the {@link DocumentError} values, for `Result` error types. */
export type DocumentError = (typeof DocumentError)[keyof typeof DocumentError];
