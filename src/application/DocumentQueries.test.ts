import { describe, expect, it } from "vitest";
import { Document } from "@/domain/Document.js";
import { InMemoryDocumentStore } from "@/infrastructure/InMemoryDocumentStore.js";
import { valueOf } from "@/test/support/results.js";
import { DeleteDocument } from "./DeleteDocument.js";
import { GetDocument } from "./GetDocument.js";
import { GetDocumentHistory } from "./GetDocumentHistory.js";

async function storeWithTwoVersions(): Promise<InMemoryDocumentStore> {
  const store = new InMemoryDocumentStore();
  const first = valueOf(Document.create("d1", "draft"));
  valueOf(await store.save(first, 0));
  valueOf(await store.save(valueOf(first.revise("final", 1)), 1));
  return store;
}

describe("GetDocument", () => {
  it("returns the current version as plain data", async () => {
    const result = await new GetDocument(await storeWithTwoVersions()).run({ id: "d1" });

    expect(result).toEqual({ ok: true, value: { id: "d1", body: "final", version: 2 } });
  });

  it("reports not-found for an unknown id", async () => {
    const result = await new GetDocument(new InMemoryDocumentStore()).run({ id: "nope" });

    expect(result).toEqual({ ok: false, error: "not-found" });
  });
});

describe("GetDocumentHistory", () => {
  it("returns every version, oldest first", async () => {
    const result = await new GetDocumentHistory(await storeWithTwoVersions()).run({ id: "d1" });

    expect(valueOf(result).versions).toEqual([
      { version: 1, body: "draft" },
      { version: 2, body: "final" },
    ]);
  });
});

describe("DeleteDocument", () => {
  it("removes the document and its history", async () => {
    const store = await storeWithTwoVersions();

    const result = await new DeleteDocument(store).run({ id: "d1" });

    expect(result.ok).toBe(true);
    expect(await store.find("d1")).toBeUndefined();
    expect(await store.history("d1")).toEqual([]);
  });

  it("reports not-found for an unknown id", async () => {
    const result = await new DeleteDocument(new InMemoryDocumentStore()).run({ id: "nope" });

    expect(result).toEqual({ ok: false, error: "not-found" });
  });
});
