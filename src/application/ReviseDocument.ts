import type { DocumentStore } from "@/application/ports/DocumentStore.js";
import type { DocumentView } from "@/application/DocumentView.js";
import type { Result } from "@/domain/Result.js";

/** Reasons a revision is refused; the interface layer maps each one to an HTTP status. */
export type ReviseDocumentError = "not-found" | "version-conflict" | "invalid-body";

/** Input of {@link ReviseDocument.run}, already validated at the HTTP boundary. */
export interface ReviseDocumentInput {
  /** Identifier of the document to change. */
  readonly id: string;
  /** Replacement text. */
  readonly body: string;
  /** Version the caller read before editing. */
  readonly expectedVersion: number;
}

/** Output of {@link ReviseDocument.run}: the new version as plain data, so the entity never leaves the use case. */
export type ReviseDocumentOutput = DocumentView;

/** Use case: replace a document's body without overwriting a newer change by someone else. */
export class ReviseDocument {
  /**
   * Binds the use case to the store it reads from and writes to.
   *
   * @param documents - Port to storage; the composition root passes an adapter.
   */
  public constructor(private readonly documents: DocumentStore) {}

  /**
   * Replaces the document's body in the store, but only if nobody revised it since the caller read
   * `expectedVersion`; otherwise changes nothing and returns why.
   *
   * @param input - The revision, already validated at the HTTP boundary: the target document, the new body, and the version the caller read before editing.
   * @returns The stored new version as plain data, or the reason the revision was refused.
   */
  public async run(
    input: ReviseDocumentInput,
  ): Promise<Result<ReviseDocumentOutput, ReviseDocumentError>> {
    const current = await this.documents.find(input.id);
    if (current === undefined) return { ok: false, error: "not-found" };

    const next = current.revise(input.body, input.expectedVersion);
    if (!next.ok) return next;

    // Saving against the version just read closes the gap between find and save:
    // a concurrent revision in between makes this save return version-conflict.
    const saved = await this.documents.save(next.value, current.version);
    if (!saved.ok) return saved;

    const { id, body, version } = saved.value;
    return { ok: true, value: { id, body, version } };
  }
}
