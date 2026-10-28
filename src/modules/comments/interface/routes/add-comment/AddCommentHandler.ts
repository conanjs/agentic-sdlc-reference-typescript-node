import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { AddCommentBody } from "./AddCommentBody.js";
import type { AddComment } from "@/modules/comments/application/add-comment/AddComment.js";
import {
  CommentsRefusal,
  type HttpErrorMapper,
} from "@/modules/comments/interface/errors/HttpErrorMapper.js";

/** Handles `POST /documents/:id/comments`: parses input, calls one use case and maps the result (EXP-1). */
export class AddCommentHandler {
  /**
   * Receives already-built collaborators from the composition root (EXP-2).
   *
   * @param addComment - The use case this route adapts.
   * @param errors - This module's mapper from refusal reasons to problems.
   */
  public constructor(
    private readonly addComment: AddComment,
    private readonly errors: HttpErrorMapper,
  ) {}

  /**
   * Turns one `POST /documents/:id/comments` into an {@link AddComment} call and writes 201 with a
   * `Location` header and the new comment, or an RFC 9457 problem: 400 for a body that fails
   * validation, 404 for an unknown document, 422 for a blank or too long text.
   *
   * @param req - `id` from the path and the JSON body `{ body }`, validated here.
   * @param res - Receives the created comment, or the problem `HttpErrorMapper` builds for a refusal.
   * @returns Resolves once the response is sent.
   */
  public async handle(req: Request<{ id: string }>, res: Response): Promise<void> {
    const parsed = AddCommentBody.safeParse(req.body);
    if (!parsed.success) {
      this.errors.problemFor(CommentsRefusal.InvalidRequest).send(res);
      return;
    }

    const result = await this.addComment.run({ documentId: req.params.id, body: parsed.data.body });
    if (!result.ok) {
      this.errors.problemFor(result.error).send(res);
      return;
    }

    const { id, documentId } = result.value;
    const location = `/documents/${encodeURIComponent(documentId)}/comments/${encodeURIComponent(id)}`;
    res.status(StatusCodes.CREATED).location(location).json(result.value);
  }
}
