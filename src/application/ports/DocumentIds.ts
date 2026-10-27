/**
 * Hands out identifiers for new documents; the only source of ids, so tests can make them predictable.
 */
export interface DocumentIds {
  /**
   * Returns an identifier that no stored document uses yet.
   *
   * @returns A non-empty string, unique for the life of the store.
   */
  next(): string;
}
