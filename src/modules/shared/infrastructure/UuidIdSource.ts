import { randomUUID } from "node:crypto";
import type { IdSource } from "@/modules/shared/application/ports/IdSource.js";

/** {@link IdSource} backed by random version-4 UUIDs from `node:crypto`. */
export class UuidIdSource implements IdSource {
  /**
   * {@link IdSource.next} as a random UUID: a collision is so unlikely that no store is consulted,
   * and a caller treats one as an unexpected failure.
   */
  public next(): string {
    return randomUUID();
  }
}
