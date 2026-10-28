import type { Request, Response } from "express";
import type { GetComment } from "@/modules/comments/application/get-comment/GetComment.js";
import type { HttpErrorMapper } from "@/modules/comments/interface/errors/HttpErrorMapper.js";

/** Handles `GET /documents/:id/comments/:commentId`: calls one use case and maps the result (EXP-1). */
export class GetCommentHandler {
  /**
   * Receives already-built collaborators from the composition root (EXP-2).
   *
   * @param getComment - The use case this route adapts.
   * @param errors - This module's mapper from refusal reasons to problems.
   */
  public constructor(
    private readonly getComment: GetComment,
    private readonly errors: HttpErrorMapper,
  ) {}

  /**
   * Turns one `GET /documents/:id/comments/:commentId` into a {@link GetComment} call and writes 200
   * with the comment, or a 404 problem when the document or the comment does not exist.
   *
   * @param req - `id` and `commentId` come from the path.
   * @param res - Receives the comment, or the problem `HttpErrorMapper` builds for a refusal.
   * @returns Resolves once the response is sent.
   */
  public async handle(
    req: Request<{ id: string; commentId: string }>,
    res: Response,
  ): Promise<void> {
    const result = await this.getComment.run({
      documentId: req.params.id,
      commentId: req.params.commentId,
    });
    if (!result.ok) {
      this.errors.problemFor(result.error).send(res);
      return;
    }

    res.json(result.value);
  }
}
