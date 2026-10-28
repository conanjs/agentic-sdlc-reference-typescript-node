import type { Comment } from "@/modules/comments/domain/comment/Comment.js";

/**
 * Keeps the comments of every document; the only way the comments use cases reach storage.
 *
 * @remarks
 * Declared here, next to the use cases that consume it (TSN-2); adapters in `infrastructure/` implement it.
 */
export interface CommentStore {
  /**
   * Stores a new comment after the comments already on its document.
   *
   * @param comment - A comment built by {@link Comment.create}, with an id no stored comment uses.
   * @returns Resolves once the comment is stored.
   */
  add(comment: Comment): Promise<void>;

  /**
   * Reads every comment written on one document, in the order they were added.
   *
   * @param documentId - The document whose comments are wanted.
   * @returns Every comment on the document, oldest first; empty when it has none.
   */
  listFor(documentId: string): Promise<readonly Comment[]>;

  /**
   * Looks up one comment on one document.
   *
   * @param documentId - The document the comment must be on.
   * @param commentId - Identifier of the comment.
   * @returns The comment, or `undefined` when that document has no comment with this id.
   */
  find(documentId: string, commentId: string): Promise<Comment | undefined>;
}
