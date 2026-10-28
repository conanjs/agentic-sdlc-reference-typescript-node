import type { DocumentIds } from "@/application/ports/DocumentIds.js";
import type { DocumentStore } from "@/application/ports/DocumentStore.js";
import type { DocumentView } from "@/application/DocumentView.js";
import { Document } from "@/domain/document/Document.js";
import type { Result } from "@/domain/Result.js";
import type { DocumentError } from "@/domain/document/DocumentError.js";

/** Input of {@link CreateDocument.run}, already validated at the HTTP boundary. */
export interface CreateDocumentInput {
  /** Initial text. */
  readonly body: string;
}

/** Use case: store a new document at version 1 under an identifier the server chooses. */
export class CreateDocument {
  /**
   * Binds the use case to its storage and its source of new identifiers.
   *
   * @param documents - Port to storage; the composition root passes an adapter.
   * @param ids - Port that hands out unused identifiers.
   */
  public constructor(
    private readonly documents: DocumentStore,
    private readonly ids: DocumentIds,
  ) {}

  /**
   * Saves a new document at version 1 under a fresh identifier, unless the body is too long.
   *
   * @param input - The initial text, already validated at the HTTP boundary.
   * @returns The stored document as plain data, or {@link DocumentError.InvalidBody} when the text exceeds the limit.
   * @throws `Error` when the fresh identifier is already taken, which the id source promises never happens.
   */
  public async run(
    input: CreateDocumentInput,
  ): Promise<Result<DocumentView, typeof DocumentError.InvalidBody>> {
    const created = Document.create(this.ids.next(), input.body);
    if (!created.ok) return created;

    // Version 0 means "nothing stored yet": the store refuses if the id is somehow in use.
    const saved = await this.documents.save(created.value, 0);
    if (!saved.ok) throw new Error(`document id ${created.value.id} is already in use`);

    const { id, body, version } = saved.value;
    return { ok: true, value: { id, body, version } };
  }
}
