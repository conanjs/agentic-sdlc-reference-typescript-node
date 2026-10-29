/**
 * Refusals the HTTP layer itself produces, before any use case runs. Shared because every module's
 * routes validate their input the same way; each module's refusal object spreads it.
 */
export const RequestError = {
  /** The body, path or query string failed the route's schema. */
  InvalidRequest: "invalid-request",
} as const;

/** One of the {@link RequestError} values, for refusal types. */
export type RequestError = (typeof RequestError)[keyof typeof RequestError];
