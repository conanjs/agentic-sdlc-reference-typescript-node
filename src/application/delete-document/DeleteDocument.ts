import type { DocumentStore } from "@/application/ports/DocumentStore.js";
import type { Result } from "@/domain/Result.js";
import { LookupError } from "@/application/LookupError.js";

/** Input of {@link DeleteDocument.run}, already validated at the HTTP boundary. */
export interface DeleteDocumentInput {
  /** Identifier of the document to delete. */
  readonly id: string;
}

/** Use case: remove a document and every version of it, for good. */
export class DeleteDocument {
  /**
   * Binds the use case to the store it removes from.
   *
   * @param documents - Port to storage; the composition root passes an adapter.
   */
  public constructor(private readonly documents: DocumentStore) {}

  /**
   * Removes the document and its whole history from the store; nothing can restore it.
   *
   * @param input - The document's identifier, given at creation.
   * @returns Success with no value, or {@link LookupError.NotFound} when no document has this id.
   */
  public async run(input: DeleteDocumentInput): Promise<Result<undefined, LookupError>> {
    const removed = await this.documents.remove(input.id);
    return removed ? { ok: true, value: undefined } : { ok: false, error: LookupError.NotFound };
  }
}
