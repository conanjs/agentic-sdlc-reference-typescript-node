import type { Request, Response } from "express";
import type { ReviseDocument } from "@/modules/documents/application/revise-document/ReviseDocument.js";
import type { HttpErrorMapper } from "@/modules/documents/interface/errors/HttpErrorMapper.js";
import { ReviseDocumentBody } from "./ReviseDocumentBody.js";

/** Handles `PUT /documents/:id`: parses input, calls one use case and maps the result (EXP-1). */
export class ReviseDocumentHandler {
  /**
   * Receives already-built collaborators from the composition root (EXP-2).
   *
   * @param reviseDocument - The use case this route adapts.
   * @param errors - Shared mapper from refusal reasons to status codes.
   */
  public constructor(
    private readonly reviseDocument: ReviseDocument,
    private readonly errors: HttpErrorMapper,
  ) {}

  /**
   * Turns one `PUT /documents/:id` into a {@link ReviseDocument} call and writes 200 with the new
   * version, or an RFC 9457 problem: 400 for a body that fails validation, or the refusal's mapped status. Express 5 forwards a rejected
   * promise to the error middleware (EXP-6).
   *
   * @param req - `PUT /documents/:id`: `id` comes from the path; the JSON body is validated here.
   * @param res - Receives the revised document, or the problem `HttpErrorMapper` builds for a refusal.
   * @returns Resolves once the response is sent.
   */
  public async handle(req: Request<{ id: string }>, res: Response): Promise<void> {
    const parsed = ReviseDocumentBody.safeParse(req.body);
    if (!parsed.success) {
      this.errors.problemFor("invalid-request").send(res);
      return;
    }

    const result = await this.reviseDocument.run({ id: req.params.id, ...parsed.data });
    if (!result.ok) {
      this.errors.problemFor(result.error).send(res);
      return;
    }

    res.json(result.value);
  }
}
