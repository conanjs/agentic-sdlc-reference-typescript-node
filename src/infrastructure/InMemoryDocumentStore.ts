import type { DocumentStore } from "@/application/ports/DocumentStore.js";
import type { Document } from "@/domain/Document.js";
import type { Result } from "@/domain/Result.js";

/** {@link DocumentStore} that keeps documents in process memory; everything is lost on restart. */
export class InMemoryDocumentStore implements DocumentStore {
  // Every version of each document, oldest first; the last one is current.
  readonly #versions = new Map<string, readonly Document[]>();

  /**
   * {@link DocumentStore.find} against this process's memory: resolves at once and never rejects,
   * so a caller here never sees a storage failure.
   */
  public find(id: string): Promise<Document | undefined> {
    return Promise.resolve(this.#versions.get(id)?.at(-1));
  }

  /**
   * {@link DocumentStore.save} into this process's memory, atomic within this process only: two server
   * instances would each keep their own copy and could both accept a revision of one version.
   */
  public save(document: Document, replaces: number): Promise<Result<Document, "version-conflict">> {
    // No await between the check and the write, so no other save can run in between.
    const versions = this.#versions.get(document.id) ?? [];
    const stored = versions.at(-1)?.version ?? 0;
    if (stored !== replaces) return Promise.resolve({ ok: false, error: "version-conflict" });
    this.#versions.set(document.id, [...versions, document]);
    return Promise.resolve({ ok: true, value: document });
  }

  /**
   * {@link DocumentStore.list} by sorting every id in memory on each call: fine for a reference app,
   * linear in the number of documents.
   */
  public list(after: string | undefined, limit: number): Promise<readonly Document[]> {
    const ids = [...this.#versions.keys()].sort().filter((id) => after === undefined || id > after);
    const page = ids.slice(0, limit).flatMap((id) => this.#versions.get(id)?.at(-1) ?? []);
    return Promise.resolve(page);
  }

  /**
   * {@link DocumentStore.history} from this process's memory; a copy, so a caller cannot change what
   * is stored.
   */
  public history(id: string): Promise<readonly Document[]> {
    return Promise.resolve([...(this.#versions.get(id) ?? [])]);
  }

  /**
   * {@link DocumentStore.remove} from this process's memory; versions are gone at once and cannot be
   * recovered.
   */
  public remove(id: string): Promise<boolean> {
    return Promise.resolve(this.#versions.delete(id));
  }
}
