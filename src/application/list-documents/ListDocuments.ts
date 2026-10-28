import type { DocumentStore } from "@/application/ports/DocumentStore.js";
import type { DocumentView } from "@/application/DocumentView.js";

/** Input of {@link ListDocuments.run}, already validated at the HTTP boundary. */
export interface ListDocumentsInput {
  /** `nextCursor` from the previous page; `undefined` for the first page. */
  readonly cursor?: string | undefined;
  /** Most documents on this page, 1 to 100. */
  readonly limit: number;
}

/** Output of {@link ListDocuments.run}: one page and how to ask for the next. */
export interface ListDocumentsOutput {
  /** Current versions, in ascending id order. */
  readonly items: readonly DocumentView[];
  /** Pass as `cursor` to get the next page; `null` on the last page. */
  readonly nextCursor: string | null;
}

/** Use case: page through the current version of every document, in a stable order, changing nothing. */
export class ListDocuments {
  /**
   * Binds the use case to the store it reads from.
   *
   * @param documents - Port to storage; the composition root passes an adapter.
   */
  public constructor(private readonly documents: DocumentStore) {}

  /**
   * Returns one page of current versions after the cursor, and a cursor for the next page.
   *
   * @param input - Where to start and how many to return.
   * @returns The page; `nextCursor` is `null` when no document follows it.
   */
  public async run(input: ListDocumentsInput): Promise<ListDocumentsOutput> {
    // One extra row tells whether another page exists, without a separate count.
    const rows = await this.documents.list(input.cursor, input.limit + 1);
    const page = rows.slice(0, input.limit);
    const items = page.map(({ id, body, version }) => ({ id, body, version }));
    const last = page.at(-1);
    return { items, nextCursor: rows.length > input.limit && last ? last.id : null };
  }
}
