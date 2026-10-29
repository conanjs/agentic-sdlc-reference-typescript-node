import type { Request, Response } from "express";

/**
 * Handles `GET /healthz`: answers 200 while the process can serve requests, so a load balancer or an
 * orchestrator knows it is alive. It checks no dependency: an in-memory store cannot be down.
 */
export class HealthHandler {
  /**
   * Writes `{ "status": "ok" }` with 200.
   *
   * @param _req - Unused: the answer does not depend on the request.
   * @param res - Receives the status body.
   */
  public handle(_req: Request, res: Response): void {
    res.json({ status: "ok" });
  }
}
