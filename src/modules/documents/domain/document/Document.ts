import type { Result } from "@/modules/shared/domain/Result.js";
import { DocumentError } from "./DocumentError.js";

/**
 * A text document whose every change creates a new version, so a write based on a stale read can be refused.
 *
 * @remarks
 * Immutable: {@link Document.revise} returns a new instance and leaves this one unchanged.
 */
export class Document {
  /** Longest body accepted, in characters. */
  public static readonly MAX_BODY_LENGTH = 1000;

  readonly #id: string;
  readonly #body: string;
  readonly #version: number;

  private constructor(id: string, body: string, version: number) {
    this.#id = id;
    this.#body = body;
    this.#version = version;
  }

  /**
   * Starts a document at version 1.
   *
   * @param id - Caller-chosen identifier; never changes.
   * @param body - Initial text, at most {@link Document.MAX_BODY_LENGTH} characters.
   * @returns The new document, or {@link DocumentError.InvalidBody} when `body` is too long.
   */
  public static create(
    id: string,
    body: string,
  ): Result<Document, typeof DocumentError.InvalidBody> {
    if (body.length > Document.MAX_BODY_LENGTH)
      return { ok: false, error: DocumentError.InvalidBody };
    return { ok: true, value: new Document(id, body, 1) };
  }

  /** Identifier given at creation; the same for every version. */
  public get id(): string {
    return this.#id;
  }

  /** Text of this version. */
  public get body(): string {
    return this.#body;
  }

  /** Starts at 1 and grows by one with every accepted revision. */
  public get version(): number {
    return this.#version;
  }

  /**
   * Replaces the body, provided the caller based the change on this version.
   *
   * @param body - New text, at most {@link Document.MAX_BODY_LENGTH} characters.
   * @param expectedVersion - Version the caller read before editing.
   * @returns The next version; {@link DocumentError.VersionConflict} when `expectedVersion` is not this version;
   * {@link DocumentError.InvalidBody} when `body` is too long.
   */
  public revise(body: string, expectedVersion: number): Result<Document, DocumentError> {
    if (expectedVersion !== this.#version)
      return { ok: false, error: DocumentError.VersionConflict };
    if (body.length > Document.MAX_BODY_LENGTH)
      return { ok: false, error: DocumentError.InvalidBody };
    return { ok: true, value: new Document(this.#id, body, this.#version + 1) };
  }
}
