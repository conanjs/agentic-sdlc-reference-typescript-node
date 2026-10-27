import { randomUUID } from "node:crypto";
import type { DocumentIds } from "@/application/ports/DocumentIds.js";

/** {@link DocumentIds} backed by random version-4 UUIDs from `node:crypto`. */
export class UuidDocumentIds implements DocumentIds {
  /**
   * {@link DocumentIds.next} as a random UUID: a collision is so unlikely that the store is not
   * consulted, and `CreateDocument` treats one as an unexpected failure.
   */
  public next(): string {
    return randomUUID();
  }
}
