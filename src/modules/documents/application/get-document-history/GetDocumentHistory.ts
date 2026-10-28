import type { DocumentStore } from "@/modules/documents/application/ports/DocumentStore.js";
import type { Result } from "@/modules/shared/domain/Result.js";
import { LookupError } from "@/modules/documents/application/LookupError.js";

/** Input of {@link GetDocumentHistory.run}, already validated at the HTTP boundary. */
export interface GetDocumentHistoryInput {
  /** Identifier of the document to read the history of. */
  readonly id: string;
}

/** One entry of {@link GetDocumentHistoryOutput}. */
export interface DocumentVersionView {
  /** Version number, from 1. */
  readonly version: number;
  /** Text of that version. */
  readonly body: string;
}

/** Output of {@link GetDocumentHistory.run}: every version of one document, oldest first. */
export interface GetDocumentHistoryOutput {
  /** Identifier given at creation. */
  readonly id: string;
  /** Versions 1 to current. */
  readonly versions: readonly DocumentVersionView[];
}

/** Use case: list every past and current version of one document; it changes nothing. */
export class GetDocumentHistory {
  /**
   * Binds the use case to the store it reads from.
   *
   * @param documents - Port to storage; the composition root passes an adapter.
   */
  public constructor(private readonly documents: DocumentStore) {}

  /**
   * Returns every stored version of one document, oldest first, read-only.
   *
   * @param input - The document's identifier, given at creation.
   * @returns The versions as plain data, or {@link LookupError.NotFound} when no document has this id.
   */
  public async run(
    input: GetDocumentHistoryInput,
  ): Promise<Result<GetDocumentHistoryOutput, LookupError>> {
    const versions = await this.documents.history(input.id);
    if (versions.length === 0) return { ok: false, error: LookupError.NotFound };
    return {
      ok: true,
      value: { id: input.id, versions: versions.map(({ version, body }) => ({ version, body })) },
    };
  }
}
