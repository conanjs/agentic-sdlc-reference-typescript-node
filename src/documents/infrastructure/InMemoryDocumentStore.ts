import type { DocumentStore } from "@/documents/application/ports/DocumentStore.js";
import type { Document } from "@/documents/domain/Document.js";
import type { Result } from "@/shared/domain/Result.js";

/** {@link DocumentStore} that keeps documents in process memory; everything is lost on restart. */
export class InMemoryDocumentStore implements DocumentStore {
  readonly #documents = new Map<string, Document>();

  /**
   * {@link DocumentStore.find} against this process's memory: resolves at once and never rejects,
   * so a caller here never sees a storage failure.
   */
  public find(id: string): Promise<Document | undefined> {
    return Promise.resolve(this.#documents.get(id));
  }

  /**
   * {@link DocumentStore.save} into this process's memory, atomic within this process only: two server
   * instances would each keep their own copy and could both accept a revision of one version.
   */
  public save(document: Document, replaces: number): Promise<Result<Document, "version-conflict">> {
    // No await between the check and the write, so no other save can run in between.
    const stored = this.#documents.get(document.id)?.version ?? 0;
    if (stored !== replaces) return Promise.resolve({ ok: false, error: "version-conflict" });
    this.#documents.set(document.id, document);
    return Promise.resolve({ ok: true, value: document });
  }
}
