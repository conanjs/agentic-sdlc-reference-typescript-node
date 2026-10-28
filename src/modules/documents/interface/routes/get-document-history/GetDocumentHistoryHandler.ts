import type { Request, Response } from "express";
import type { GetDocumentHistory } from "@/modules/documents/application/get-document-history/GetDocumentHistory.js";
import type { HttpErrorMapper } from "@/modules/documents/interface/errors/HttpErrorMapper.js";

/** Handles `GET /documents/:id/versions`: parses input, calls one use case and maps the result (EXP-1). */
export class GetDocumentHistoryHandler {
  /**
   * Receives already-built collaborators from the composition root (EXP-2).
   *
   * @param getDocumentHistory - The use case this route adapts.
   * @param errors - This module's mapper from refusal reasons to problems.
   */
  public constructor(
    private readonly getDocumentHistory: GetDocumentHistory,
    private readonly errors: HttpErrorMapper,
  ) {}

  /**
   * Turns one `GET /documents/:id/versions` into a {@link GetDocumentHistory} call and writes 200 with
   * every version, oldest first, or a 404 problem when no document has the id.
   *
   * @param req - `GET /documents/:id/versions`: `id` comes from the path.
   * @param res - Receives the versions, or the problem `HttpErrorMapper` builds for a refusal.
   * @returns Resolves once the response is sent.
   */
  public async handle(req: Request<{ id: string }>, res: Response): Promise<void> {
    const result = await this.getDocumentHistory.run({ id: req.params.id });
    if (!result.ok) {
      this.errors.problemFor(result.error).send(res);
      return;
    }

    res.json(result.value);
  }
}
