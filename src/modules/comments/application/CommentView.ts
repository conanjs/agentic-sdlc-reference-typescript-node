/**
 * A comment as the use cases hand it out: plain data, so the `Comment` entity never leaves the
 * application layer (CA-4).
 */
export interface CommentView {
  /** Identifier given at creation; never changes. */
  readonly id: string;
  /** Identifier of the document this comment is on. */
  readonly documentId: string;
  /** The text, as written. */
  readonly body: string;
}
