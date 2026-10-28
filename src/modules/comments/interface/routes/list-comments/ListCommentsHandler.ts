import type { Request, Response } from "express";
import type { ListComments } from "@/modules/comments/application/list-comments/ListComments.js";
import type { HttpErrorMapper } from "@/modules/comments/interface/errors/HttpErrorMapper.js";

/** Handles `GET /documents/:id/comments`: parses input, calls one use case and maps the result (EXP-1). */
export class ListCommentsHandler {
  /**
   * Receives already-built collaborators from the composition root (EXP-2).
   *
   * @param listComments - The use case this route adapts.
   * @param errors - This module's mapper from refusal reasons to problems.
   */
  public constructor(
    private readonly listComments: ListComments,
    private readonly errors: HttpErrorMapper,
  ) {}

  /**
   * Turns one `GET /documents/:id/comments` into a {@link ListComments} call and writes 200 with
   * `{ items }`, oldest first, or a 404 problem when no document has the id.
   *
   * @param req - `GET /documents/:id/comments`: `id` comes from the path.
   * @param res - Receives the comments, or the problem `HttpErrorMapper` builds for a refusal.
   * @returns Resolves once the response is sent.
   */
  public async handle(req: Request<{ id: string }>, res: Response): Promise<void> {
    const result = await this.listComments.run({ documentId: req.params.id });
    if (!result.ok) {
      this.errors.problemFor(result.error).send(res);
      return;
    }

    res.json(result.value);
  }
}
