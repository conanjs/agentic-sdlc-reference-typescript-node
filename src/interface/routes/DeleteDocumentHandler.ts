import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import type { DeleteDocument } from "@/application/DeleteDocument.js";
import type { HttpErrorMapper } from "@/interface/errors/HttpErrorMapper.js";

/** Handles `DELETE /documents/:id`: parses input, calls one use case and maps the result (EXP-1). */
export class DeleteDocumentHandler {
  /**
   * Receives already-built collaborators from the composition root (EXP-2).
   *
   * @param deleteDocument - The use case this route adapts.
   * @param errors - This module's mapper from refusal reasons to problems.
   */
  public constructor(
    private readonly deleteDocument: DeleteDocument,
    private readonly errors: HttpErrorMapper,
  ) {}

  /**
   * Turns one `DELETE /documents/:id` into a {@link DeleteDocument} call and writes 204 with no body,
   * or a 404 problem when no document has the id.
   *
   * @param req - `DELETE /documents/:id`: `id` comes from the path.
   * @param res - Receives an empty 204, or the problem `HttpErrorMapper` builds for a refusal.
   * @returns Resolves once the response is sent.
   */
  public async handle(req: Request<{ id: string }>, res: Response): Promise<void> {
    const result = await this.deleteDocument.run({ id: req.params.id });
    if (!result.ok) {
      this.errors.problemFor(result.error).send(res);
      return;
    }

    res.status(StatusCodes.NO_CONTENT).end();
  }
}
