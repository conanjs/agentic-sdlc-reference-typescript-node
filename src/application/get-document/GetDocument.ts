import type { DocumentStore } from "@/application/ports/DocumentStore.js";
import type { DocumentView } from "@/application/DocumentView.js";
import type { Result } from "@/domain/Result.js";
import { LookupError } from "@/application/LookupError.js";

/** Input of {@link GetDocument.run}, already validated at the HTTP boundary. */
export interface GetDocumentInput {
  /** Identifier of the document to read. */
  readonly id: string;
}

/** Use case: read the current version of one document; it changes nothing. */
export class GetDocument {
  /**
   * Binds the use case to the store it reads from.
   *
   * @param documents - Port to storage; the composition root passes an adapter.
   */
  public constructor(private readonly documents: DocumentStore) {}

  /**
   * Returns the current version of one document, read-only.
   *
   * @param input - The document's identifier, given at creation.
   * @returns The current version as plain data, or {@link LookupError.NotFound} when no document has this id.
   */
  public async run(input: GetDocumentInput): Promise<Result<DocumentView, LookupError>> {
    const document = await this.documents.find(input.id);
    if (document === undefined) return { ok: false, error: LookupError.NotFound };
    const { body, version } = document;
    return { ok: true, value: { id: input.id, body, version } };
  }
}
