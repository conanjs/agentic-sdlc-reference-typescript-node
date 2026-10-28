import { performance } from "node:perf_hooks";
import type { RequestHandler } from "express";
import type { Logger } from "pino";
import type { IdSource } from "@/modules/shared/application/ports/IdSource.js";

/**
 * Gives every request an id, returns it in a response header, and logs one structured line when the
 * response is sent, for every module (EXP-3, TSN-10).
 */
export class RequestLogMiddleware {
  /** Request and response header that carries the request id. */
  public static readonly HEADER = "X-Request-Id";

  // An incoming id is kept only when it is short and plain, so a client cannot inject text into logs.
  static readonly #ACCEPTED_ID = /^[\w.-]{1,128}$/;

  /**
   * Binds the middleware to the logger it writes to and the source of new request ids.
   *
   * @param logger - Receives one `request.completed` event per response.
   * @param ids - Makes an id for a request that did not bring a usable one.
   */
  public constructor(
    private readonly logger: Logger,
    private readonly ids: IdSource,
  ) {}

  /**
   * Builds the Express middleware, mounted before every route and the body parser, so even a request
   * rejected for malformed JSON gets an id and a log line.
   *
   * @returns Middleware that keeps a plain incoming `X-Request-Id` or makes a new one, echoes it on the
   *   response, and logs `requestId`, method, path, status and duration when the response finishes.
   */
  public handler(): RequestHandler {
    return (req, res, next) => {
      const started = performance.now();
      const incoming = req.get(RequestLogMiddleware.HEADER);
      const requestId =
        incoming !== undefined && RequestLogMiddleware.#ACCEPTED_ID.test(incoming)
          ? incoming
          : this.ids.next();
      res.setHeader(RequestLogMiddleware.HEADER, requestId);
      res.on("finish", () => {
        // The path leaves out the query string, so cursors and filters stay out of the logs.
        this.logger.info(
          {
            requestId,
            method: req.method,
            path: req.path,
            status: res.statusCode,
            durationMs: Math.round(performance.now() - started),
          },
          "request.completed",
        );
      });
      next();
    };
  }
}
