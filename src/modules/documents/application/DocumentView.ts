/**
 * A document as the use cases hand it out: plain data, so the `Document` entity never leaves the
 * application layer (CA-4).
 */
export interface DocumentView {
  /** Identifier given at creation; never changes. */
  readonly id: string;
  /** Text of this version. */
  readonly body: string;
  /** Starts at 1 and grows by one with every accepted revision. */
  readonly version: number;
}
