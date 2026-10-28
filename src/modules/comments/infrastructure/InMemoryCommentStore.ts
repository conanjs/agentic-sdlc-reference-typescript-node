import type { CommentStore } from "@/modules/comments/application/ports/CommentStore.js";
import type { Comment } from "@/modules/comments/domain/comment/Comment.js";

/** {@link CommentStore} that keeps comments in process memory; everything is lost on restart. */
export class InMemoryCommentStore implements CommentStore {
  // The comments of each document, oldest first, keyed by document id.
  readonly #byDocument = new Map<string, readonly Comment[]>();

  /**
   * {@link CommentStore.add} into this process's memory: resolves at once and never rejects, so a
   * caller here never sees a storage failure.
   */
  public add(comment: Comment): Promise<void> {
    const existing = this.#byDocument.get(comment.documentId) ?? [];
    this.#byDocument.set(comment.documentId, [...existing, comment]);
    return Promise.resolve();
  }

  /** {@link CommentStore.listFor} from this process's memory, in the order the comments were added. */
  public listFor(documentId: string): Promise<readonly Comment[]> {
    return Promise.resolve(this.#byDocument.get(documentId) ?? []);
  }

  /** {@link CommentStore.find} by scanning the document's comments: fine for a reference app. */
  public find(documentId: string, commentId: string): Promise<Comment | undefined> {
    return Promise.resolve(this.#byDocument.get(documentId)?.find((c) => c.id === commentId));
  }
}
