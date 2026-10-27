import type { ErrorRequestHandler } from "express";
import { StatusCodes } from "http-status-codes";
import type { Logger } from "pino";
import { ProblemDetails } from "@/modules/shared/interface/ProblemDetails.js";

/** Turns errors thrown anywhere in a request into problem responses, for every module (EXP-5, EXP-8). */
export class ErrorMiddleware {
  /**
   * Binds the middleware to the logger that records unexpected failures.
   *
   * @param logger - Receives one `request.failed` event per 500 response, with the error; the client
   *   never sees it.
   */
  public constructor(private readonly logger: Logger) {}

  /**
   * Builds the Express error middleware, mounted after every route: 4xx for a request Express itself
   * rejected (malformed JSON, too large), 500 for anything else.
   *
   * @returns Middleware that sends an `about:blank` problem and logs every 500.
   */
  public handler(): ErrorRequestHandler {
    return (err: unknown, _req, res, _next) => {
      // The JSON body parser marks malformed input with a 4xx status; anything else is a bug or an I/O failure.
      const status =
        typeof err === "object" && err !== null && "status" in err && typeof err.status === "number"
          ? err.status
          : StatusCodes.INTERNAL_SERVER_ERROR;
      if (status >= 500) this.logger.error({ err }, "request.failed");
      ProblemDetails.generic(status).send(res);
    };
  }
}
