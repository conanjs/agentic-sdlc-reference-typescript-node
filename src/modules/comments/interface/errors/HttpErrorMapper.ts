import { StatusCodes } from "http-status-codes";
import { CommentLookupError } from "@/modules/comments/application/CommentLookupError.js";
import { CommentError } from "@/modules/comments/domain/comment/CommentError.js";
import { ProblemDetails } from "@/modules/shared/interface/ProblemDetails.js";
import { RequestError } from "@/modules/shared/interface/RequestError.js";

/**
 * Reasons a comments route refuses a request: the use cases' errors plus a request that failed
 * validation. Each value is defined once, in the layer that owns it, and spread in here.
 */
export const CommentsRefusal = { ...CommentError, ...CommentLookupError, ...RequestError } as const;

/** One of the {@link CommentsRefusal} values: every reason {@link HttpErrorMapper.problemFor} accepts. */
export type CommentsRefusal = (typeof CommentsRefusal)[keyof typeof CommentsRefusal];

/** The single place that turns this module's refusals into HTTP problems (TSN-11, EXP-5, EXP-8). */
export class HttpErrorMapper {
  // A Record over the union makes the compiler reject a new refusal that has no status.
  readonly #statuses: Readonly<Record<CommentsRefusal, number>> = {
    [CommentsRefusal.InvalidRequest]: StatusCodes.BAD_REQUEST,
    [CommentsRefusal.NotFound]: StatusCodes.NOT_FOUND,
    [CommentsRefusal.InvalidBody]: StatusCodes.UNPROCESSABLE_ENTITY,
  };

  /**
   * Returns the problem a client receives for an expected refusal, with no I/O and no logging: a
   * refusal is always a 4xx, never a 500.
   *
   * @param reason - Why the route or its use case refused the request.
   * @returns A problem with `type` `/problems/<reason>`: 400, 404 or 422.
   */
  public problemFor(reason: CommentsRefusal): ProblemDetails {
    return ProblemDetails.forReason(this.#statuses[reason], reason);
  }
}
