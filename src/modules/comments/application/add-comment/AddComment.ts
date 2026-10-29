import type { GetDocument } from "@/modules/documents/application/get-document/GetDocument.js";
import type { CommentView } from "@/modules/comments/application/CommentView.js";
import { CommentLookupError } from "@/modules/comments/application/CommentLookupError.js";
import type { CommentStore } from "@/modules/comments/application/ports/CommentStore.js";
import { Comment } from "@/modules/comments/domain/comment/Comment.js";
import type { CommentError } from "@/modules/comments/domain/comment/CommentError.js";
import type { IdSource } from "@/modules/shared/application/ports/IdSource.js";
import type { Result } from "@/modules/shared/domain/Result.js";

/** Input of {@link AddComment.run}, already validated at the HTTP boundary. */
export interface AddCommentInput {
  /** The document to comment on. */
  readonly documentId: string;
  /** The comment's text. */
  readonly body: string;
}

/** Use case: add a comment to an existing document, under an identifier the server chooses. */
export class AddComment {
  /**
   * Binds the use case to the documents module's public use case, its own storage and an id source.
   *
   * @param documents - The documents module's {@link GetDocument}: the only way this module learns
   *   whether a document exists (MOD-3).
   * @param comments - Port to this module's storage.
   * @param ids - Port that hands out unused identifiers.
   */
  public constructor(
    private readonly documents: GetDocument,
    private readonly comments: CommentStore,
    private readonly ids: IdSource,
  ) {}

  /**
   * Stores a new comment on the document, unless the document does not exist or the text is invalid.
   *
   * @param input - The document id from the path and the text from the body.
   * @returns The stored comment as plain data; {@link CommentLookupError.NotFound} when no document has
   *   the id; {@link CommentError.InvalidBody} when the text is blank or too long.
   */
  public async run(
    input: AddCommentInput,
  ): Promise<Result<CommentView, CommentLookupError | CommentError>> {
    const target = await this.documents.run({ id: input.documentId });
    if (!target.ok) return { ok: false, error: CommentLookupError.NotFound };

    const created = Comment.create(this.ids.next(), input.documentId, input.body);
    if (!created.ok) return created;

    await this.comments.add(created.value);
    const { id, documentId, body } = created.value;
    return { ok: true, value: { id, documentId, body } };
  }
}
