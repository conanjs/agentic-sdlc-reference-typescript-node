import { Document } from "@/domain/document/Document.js";
import { InMemoryDocumentStore } from "@/infrastructure/InMemoryDocumentStore.js";
import { valueOf } from "@/test/support/results.js";

/**
 * Builds an in-memory store holding document `d1` in two versions, `draft` then `final`, for the
 * query and delete use-case tests.
 *
 * @returns A store whose `d1` is at version 2.
 */
export async function storeWithTwoVersions(): Promise<InMemoryDocumentStore> {
  const store = new InMemoryDocumentStore();
  const first = valueOf(Document.create("d1", "draft"));
  valueOf(await store.save(first, 0));
  valueOf(await store.save(valueOf(first.revise("final", 1)), 1));
  return store;
}
