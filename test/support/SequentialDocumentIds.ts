import type { DocumentIds } from "@/modules/documents/application/ports/DocumentIds.js";

/** {@link DocumentIds} for tests: `d1`, `d2`, … in order, so assertions can name the ids. */
export class SequentialDocumentIds implements DocumentIds {
  #last = 0;

  /** {@link DocumentIds.next} as `d<n>`, counting from 1 for each new instance. */
  public next(): string {
    this.#last += 1;
    return `d${this.#last}`;
  }
}
