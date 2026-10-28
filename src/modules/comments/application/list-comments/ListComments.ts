import type { GetDocument } from "@/modules/documents/application/get-document/GetDocument.js";
import type { CommentView } from "@/modules/comments/application/CommentView.js";
import { CommentLookupError } from "@/modules/comments/application/CommentLookupError.js";
import type { CommentStore } from "@/modules/comments/application/ports/CommentStore.js";
import type { Result } from "@/modules/shared/domain/Result.js";

/** Input of {@link ListComments.run}. */
export interface ListCommentsInput {
  /** The document whose comments are wanted. */
  readonly documentId: string;
}

/** Output of {@link ListComments.run}: every comment as plain data, oldest first. */
export interface ListCommentsOutput {
  /** The comments; empty when the document has none. */
  readonly items: readonly CommentView[];
}

/** Use case: list the comments on an existing document. Changes nothing. */
export class ListComments {
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
   * Reads every comment on the document, oldest first, after checking that the document exists.
   *
   * @param input - The document id from the path.
   * @returns The comments, or {@link CommentLookupError.NotFound} when no document has the id, even if
   *   comments on a deleted document are still stored.
   */
  public async run(
    input: ListCommentsInput,
  ): Promise<Result<ListCommentsOutput, CommentLookupError>> {
    const target = await this.documents.run({ id: input.documentId });
    if (!target.ok) return { ok: false, error: CommentLookupError.NotFound };

    const comments = await this.comments.listFor(input.documentId);
    const items = comments.map(({ id, documentId, body }) => ({ id, documentId, body }));
    return { ok: true, value: { items } };
  }
}
