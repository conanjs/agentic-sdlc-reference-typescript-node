import type { Result } from "@/modules/shared/domain/Result.js";
import { CommentError } from "./CommentError.js";

/**
 * A remark on one document; it never changes once written.
 *
 * @remarks
 * It refers to its document by id only: the document belongs to another module, so the comment
 * holds no reference to that module's entity (MOD-3).
 */
export class Comment {
  /** Longest text accepted, in characters. */
  public static readonly MAX_BODY_LENGTH = 500;

  readonly #id: string;
  readonly #documentId: string;
  readonly #body: string;

  private constructor(id: string, documentId: string, body: string) {
    this.#id = id;
    this.#documentId = documentId;
    this.#body = body;
  }

  /**
   * Writes a comment on a document, provided the text has something in it and fits the limit.
   *
   * @param id - Identifier for the new comment; never changes.
   * @param documentId - The document commented on; the caller has checked that it exists.
   * @param body - The text, 1 to {@link Comment.MAX_BODY_LENGTH} characters, not only whitespace.
   * @returns The new comment, or {@link CommentError.InvalidBody} when the text is blank or too long.
   */
  public static create(
    id: string,
    documentId: string,
    body: string,
  ): Result<Comment, typeof CommentError.InvalidBody> {
    if (body.trim().length === 0 || body.length > Comment.MAX_BODY_LENGTH)
      return { ok: false, error: CommentError.InvalidBody };
    return { ok: true, value: new Comment(id, documentId, body) };
  }

  /** Identifier given at creation. */
  public get id(): string {
    return this.#id;
  }

  /** Identifier of the document this comment is on. */
  public get documentId(): string {
    return this.#documentId;
  }

  /** The text, as written. */
  public get body(): string {
    return this.#body;
  }
}
