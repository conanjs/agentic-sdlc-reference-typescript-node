import type { GetDocument } from "@/modules/documents/application/get-document/GetDocument.js";
import type { CommentView } from "@/modules/comments/application/CommentView.js";
import { CommentLookupError } from "@/modules/comments/application/CommentLookupError.js";
import type { CommentStore } from "@/modules/comments/application/ports/CommentStore.js";
import type { Result } from "@/modules/shared/domain/Result.js";

/** Input of {@link GetComment.run}. */
export interface GetCommentInput {
  /** The document the comment must be on. */
  readonly documentId: string;
  /** Identifier of the comment. */
  readonly commentId: string;
}

/** Use case: read one comment on an existing document. Changes nothing. */
export class GetComment {
  /**
   * Binds the use case to the documents module's public use case and this module's storage.
   *
   * @param documents - The documents module's {@link GetDocument}, to check that the document exists.
   * @param comments - Port to this module's storage.
   */
  public constructor(
    private readonly documents: GetDocument,
    private readonly comments: CommentStore,
  ) {}

  /**
   * Reads one comment, after checking that its document still exists.
   *
   * @param input - The document id and the comment id from the path.
   * @returns The comment, or {@link CommentLookupError.NotFound} when the document is gone or has no
   *   comment with that id.
   */
  public async run(input: GetCommentInput): Promise<Result<CommentView, CommentLookupError>> {
    const target = await this.documents.run({ id: input.documentId });
    if (!target.ok) return { ok: false, error: CommentLookupError.NotFound };

    const comment = await this.comments.find(input.documentId, input.commentId);
    if (comment === undefined) return { ok: false, error: CommentLookupError.NotFound };
    const { id, documentId, body } = comment;
    return { ok: true, value: { id, documentId, body } };
  }
}
