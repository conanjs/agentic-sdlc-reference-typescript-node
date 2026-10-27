import { StatusCodes } from "http-status-codes";
import type { ReviseDocumentError } from "@/application/ReviseDocument.js";
import { ProblemDetails } from "@/interface/ProblemDetails.js";

/** Reasons a documents route refuses a request: the use cases' errors plus a body that failed validation. */
export type DocumentsRefusal = ReviseDocumentError | "invalid-request";

/** The single place that turns this module's refusals into HTTP problems (TSN-11, EXP-5, EXP-8). */
export class HttpErrorMapper {
  // A Record over the union makes the compiler reject a new refusal that has no status.
  readonly #statuses: Readonly<Record<DocumentsRefusal, number>> = {
    "invalid-request": StatusCodes.BAD_REQUEST,
    "not-found": StatusCodes.NOT_FOUND,
    "version-conflict": StatusCodes.CONFLICT,
    "invalid-body": StatusCodes.UNPROCESSABLE_ENTITY,
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
