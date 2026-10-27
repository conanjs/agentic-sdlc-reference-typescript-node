import type { Response } from "express";
import { getReasonPhrase } from "http-status-codes";

/**
 * An RFC 9457 problem body (`application/problem+json`): the one error shape every route sends
 * (EXP-8).
 *
 * @remarks
 * `type` is a relative URI, `/problems/<reason>`, resolved against the API's own base URI; RFC 9457
 * recommends absolute URIs where possible, and a deployed service would use its documentation URL.
 * `about:blank` marks a problem with no meaning beyond its status code.
 */
export class ProblemDetails {
  readonly #type: string;
  readonly #status: number;
  readonly #title: string;

  private constructor(type: string, status: number) {
    this.#type = type;
    this.#status = status;
    this.#title = getReasonPhrase(status);
  }

  /**
   * Builds the problem for one named refusal reason, so clients can branch on `type` instead of
   * parsing text.
   *
   * @param status - The HTTP status the response carries; RFC 9457 requires the body to repeat it.
   * @param reason - Kebab-case reason, e.g. `version-conflict`; becomes `/problems/<reason>`.
   * @returns A problem whose title is the status code's reason phrase.
   */
  public static forReason(status: number, reason: string): ProblemDetails {
    return new ProblemDetails(`/problems/${reason}`, status);
  }

  /**
   * Builds a problem that says nothing beyond its status code, for failures the API does not name:
   * malformed JSON, or an unexpected error whose cause must stay in the logs.
   *
   * @param status - The HTTP status the response carries.
   * @returns A problem with `type` `about:blank` and the status code's reason phrase as title.
   */
  public static generic(status: number): ProblemDetails {
    return new ProblemDetails("about:blank", status);
  }

  /**
   * Writes this problem as the whole response: status line, `application/problem+json` and the body.
   *
   * @param res - An Express response nothing has been written to yet.
   */
  public send(res: Response): void {
    res
      .status(this.#status)
      .type("application/problem+json")
      .json({ type: this.#type, title: this.#title, status: this.#status });
  }
}
