import { describe, expect, it } from "vitest";
import { valueOf } from "@/test/support/results.js";
import { storeWithTwoVersions } from "@/test/support/documentStores.js";
import { GetDocumentHistory } from "./GetDocumentHistory.js";

describe("GetDocumentHistory", () => {
  it("returns every version, oldest first", async () => {
    const result = await new GetDocumentHistory(await storeWithTwoVersions()).run({ id: "d1" });

    expect(valueOf(result).versions).toEqual([
      { version: 1, body: "draft" },
      { version: 2, body: "final" },
    ]);
  });
});
