import type { IdSource } from "@/modules/shared/application/ports/IdSource.js";

/** {@link IdSource} for tests: `<prefix>1`, `<prefix>2`, … in order, so assertions can name the ids. */
export class SequentialIds implements IdSource {
  #last = 0;

  /**
   * Starts a counter whose ids carry `prefix`.
   *
   * @param prefix - Text before the number, such as `d` for documents or `c` for comments.
   */
  public constructor(private readonly prefix: string) {}

  /** {@link IdSource.next} as `<prefix><n>`, counting from 1 for each new instance. */
  public next(): string {
    this.#last += 1;
    return `${this.prefix}${this.#last}`;
  }
}
