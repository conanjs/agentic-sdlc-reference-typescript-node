import type { Document } from "@/modules/documents/domain/Document.js";
import type { Result } from "@/modules/shared/domain/Result.js";

/**
 * Keeps every version of each document; the only way the use cases reach storage.
 *
 * @remarks
 * Declared here, next to the use cases that consume it (TSN-2); adapters in `infrastructure/` implement it.
 */
export interface DocumentStore {
  /**
   * Looks up the current version of a document.
   *
   * @param id - Identifier given at creation.
   * @returns The stored version, or `undefined` when no document has this id.
   */
  find(id: string): Promise<Document | undefined>;

  /**
   * Stores `document` as the current version, but only if the stored version is still `replaces`.
   *
   * @remarks
   * The check and the write are one atomic step, so of two concurrent writers based on the same
   * version exactly one succeeds.
   *
   * @param document - The new version, as built by {@link Document.create} or {@link Document.revise}.
   * @param replaces - Version the caller read; `0` when `document` is new.
   * @returns The stored document, or `version-conflict` when another write got there first.
   */
  save(document: Document, replaces: number): Promise<Result<Document, "version-conflict">>;

  /**
   * Lists the current version of documents in ascending id order, one page at a time.
   *
   * @param after - Return only documents whose id sorts after this one; `undefined` for the first page.
   * @param limit - Most documents to return; at least 1.
   * @returns Up to `limit` documents, empty when no id sorts after `after`.
   */
  list(after: string | undefined, limit: number): Promise<readonly Document[]>;

  /**
   * Returns every stored version of one document, oldest first.
   *
   * @param id - Identifier given at creation.
   * @returns Versions 1 to current, or an empty list when no document has this id.
   */
  history(id: string): Promise<readonly Document[]>;

  /**
   * Deletes a document together with all its versions; a later `find` or `history` sees nothing.
   *
   * @param id - Identifier given at creation.
   * @returns `true` when a document was removed, `false` when none had this id.
   */
  remove(id: string): Promise<boolean>;
}
