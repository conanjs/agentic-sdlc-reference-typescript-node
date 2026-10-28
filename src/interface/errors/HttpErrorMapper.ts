import { StatusCodes } from "http-status-codes";
import { LookupError } from "@/application/LookupError.js";
import { DocumentError } from "@/domain/document/DocumentError.js";
import { ProblemDetails } from "@/interface/ProblemDetails.js";

/**
 * Reasons a documents route refuses a request: the use cases' errors plus a request that failed
 * validation. Each value is defined once, in the layer that owns it, and spread in here.
 */
export const DocumentsRefusal = {
  ...DocumentError,
  ...LookupError,
  /** The body or query string failed the route's schema. */
  InvalidRequest: "invalid-request",
} as const;

/** One of the {@link DocumentsRefusal} values: every reason {@link HttpErrorMapper.problemFor} accepts. */
export type DocumentsRefusal = (typeof DocumentsRefusal)[keyof typeof DocumentsRefusal];

/** The single place that turns this module's refusals into HTTP problems (TSN-11, EXP-5, EXP-8). */
export class HttpErrorMapper {
  // A Record over the union makes the compiler reject a new refusal that has no status.
  readonly #statuses: Readonly<Record<DocumentsRefusal, number>> = {
    [DocumentsRefusal.InvalidRequest]: StatusCodes.BAD_REQUEST,
    [DocumentsRefusal.NotFound]: StatusCodes.NOT_FOUND,
    [DocumentsRefusal.VersionConflict]: StatusCodes.CONFLICT,
    [DocumentsRefusal.InvalidBody]: StatusCodes.UNPROCESSABLE_ENTITY,
  };

  /**
   * Returns the problem a client receives for an expected refusal, with no I/O and no logging: a
   * refusal is always a 4xx, never a 500.
   *
   * @param reason - Why the route or its use case refused the request.
   * @returns A problem with `type` `/problems/<reason>`: 400, 404, 409 or 422.
   */
  public problemFor(reason: DocumentsRefusal): ProblemDetails {
    return ProblemDetails.forReason(this.#statuses[reason], reason);
  }
}
