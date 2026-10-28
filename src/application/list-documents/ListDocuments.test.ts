import { describe, expect, it } from "vitest";
import { Document } from "@/domain/document/Document.js";
import { InMemoryDocumentStore } from "@/infrastructure/InMemoryDocumentStore.js";
import { valueOf } from "@/test/support/results.js";
import { ListDocuments } from "./ListDocuments.js";

async function storeWith(...ids: string[]): Promise<InMemoryDocumentStore> {
  const store = new InMemoryDocumentStore();
  for (const id of ids) valueOf(await store.save(valueOf(Document.create(id, `body of ${id}`)), 0));
  return store;
}

describe("ListDocuments", () => {
  it("pages through documents in id order with a cursor", async () => {
    const list = new ListDocuments(await storeWith("c", "a", "b"));

    const first = await list.run({ limit: 2 });
    const second = await list.run({ cursor: first.nextCursor ?? undefined, limit: 2 });

    expect(first.items.map((d) => d.id)).toEqual(["a", "b"]);
    expect(first.nextCursor).toBe("b");
    expect(second.items.map((d) => d.id)).toEqual(["c"]);
    expect(second.nextCursor).toBeNull();
  });

  it("returns an empty last page for an empty store", async () => {
    const page = await new ListDocuments(new InMemoryDocumentStore()).run({ limit: 20 });

    expect(page).toEqual({ items: [], nextCursor: null });
  });
});
