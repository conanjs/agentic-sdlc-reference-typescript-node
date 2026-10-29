import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { ProblemDetails } from "@/modules/shared/interface/ProblemDetails.js";

/**
 * Answers a request no route serves (an unknown path, or a method a path does not support) with an
 * `about:blank` 404 problem, so even this answer is RFC 9457 (EXP-8) instead of Express's HTML page.
 */
export class NotFoundHandler {
  /**
   * Writes the 404 problem; mounted after every route and before the error middleware.
   *
   * @param _req - Unused: every unserved request gets the same answer.
   * @param res - Receives the problem.
   */
  public handle(_req: Request, res: Response): void {
    ProblemDetails.generic(StatusCodes.NOT_FOUND).send(res);
  }
}
