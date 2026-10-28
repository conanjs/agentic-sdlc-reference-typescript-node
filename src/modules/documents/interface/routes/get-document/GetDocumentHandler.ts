import type { Request, Response } from "express";
import type { GetDocument } from "@/modules/documents/application/get-document/GetDocument.js";
import type { HttpErrorMapper } from "@/modules/documents/interface/errors/HttpErrorMapper.js";

/** Handles `GET /documents/:id`: parses input, calls one use case and maps the result (EXP-1). */
export class GetDocumentHandler {
  /**
   * Receives already-built collaborators from the composition root (EXP-2).
   *
   * @param getDocument - The use case this route adapts.
   * @param errors - This module's mapper from refusal reasons to problems.
   */
  public constructor(
    private readonly getDocument: GetDocument,
    private readonly errors: HttpErrorMapper,
  ) {}

  /**
   * Turns one `GET /documents/:id` into a {@link GetDocument} call and writes 200 with the current
   * version, or a 404 problem when no document has the id.
   *
   * @param req - `GET /documents/:id`: `id` comes from the path.
   * @param res - Receives the document, or the problem `HttpErrorMapper` builds for a refusal.
   * @returns Resolves once the response is sent.
   */
  public async handle(req: Request<{ id: string }>, res: Response): Promise<void> {
    const result = await this.getDocument.run({ id: req.params.id });
    if (!result.ok) {
      this.errors.problemFor(result.error).send(res);
      return;
    }

    res.json(result.value);
  }
}
