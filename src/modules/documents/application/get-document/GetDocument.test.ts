import { describe, expect, it } from "vitest";
import { InMemoryDocumentStore } from "@/modules/documents/infrastructure/InMemoryDocumentStore.js";
import { storeWithTwoVersions } from "@/test/support/documentStores.js";
import { GetDocument } from "./GetDocument.js";

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
