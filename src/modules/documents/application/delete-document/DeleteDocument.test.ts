import { describe, expect, it } from "vitest";
import { InMemoryDocumentStore } from "@/modules/documents/infrastructure/InMemoryDocumentStore.js";
import { storeWithTwoVersions } from "@/test/support/documentStores.js";
import { DeleteDocument } from "./DeleteDocument.js";
import { LookupError } from "@/modules/documents/application/LookupError.js";

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

    expect(result).toEqual({ ok: false, error: LookupError.NotFound });
  });
});
