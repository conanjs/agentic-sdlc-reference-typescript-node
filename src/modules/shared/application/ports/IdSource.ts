/**
 * Hands out identifiers for new records, so tests can make them predictable. Shared because more
 * than one module needs it (documents, comments, request ids).
 */
export interface IdSource {
  /**
   * Returns an identifier no record created from this source uses yet.
   *
   * @returns A non-empty string, unique for the life of the process.
   */
  next(): string;
}
