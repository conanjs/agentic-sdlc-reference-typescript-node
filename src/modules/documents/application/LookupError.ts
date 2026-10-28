/**
 * Reasons a use case of this module fails to find what it was asked for. Shared by every use case
 * that looks a document up; the value is what clients see, as the problem type `/problems/<value>`.
 */
export const LookupError = {
  /** No document has the requested id. */
  NotFound: "not-found",
} as const;

/** One of the {@link LookupError} values, for `Result` error types. */
export type LookupError = (typeof LookupError)[keyof typeof LookupError];
