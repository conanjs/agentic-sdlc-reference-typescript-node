# Requirements for scripts/check-doc-links.mjs (TSN-13), as executable scenarios (specs/004-script-scenarios).
# Change policy: a changed behavior edits its scenario in the same commit as the script.

Feature: Doc-comment link check
  Every {@link X} in a doc comment of a tsconfig file must resolve the way an editor's "go to definition" does.

  Background:
    Given the fixture "links"

  Scenario: Links to an imported type and to its member resolve
    When the script "check-doc-links.mjs" runs
    Then it exits with 0 and prints:
      """
      2 {@link} tags resolve
      """

  Scenario: A link to a name the file does not import fails with file and line
    Given the file "src/Other.ts" contains:
      """
      export const x = 1;

      /** Unlike {@link Port}, this file never imports it. */
      export const y = 2;
      """
    When the script "check-doc-links.mjs" runs
    Then it exits with 1 and prints:
      """
      1 unresolved {@link}: import the target, or link only what this file depends on (TSN-13)
        src/Other.ts:3 {@link Port}
      """

  Scenario: A link to a member that does not exist fails
    Given the file "src/User.ts" contains:
      """
      import type { Port } from "./Port.js";

      /** Calls {@link Port.stop}. */
      export function use(port: Port): void {
        port.run();
      }
      """
    When the script "check-doc-links.mjs" runs
    Then it exits with 1 and prints:
      """
      1 unresolved {@link}: import the target, or link only what this file depends on (TSN-13)
        src/User.ts:3 {@link Port.stop}
      """

  Scenario: Files outside the tsconfig are not checked
    Given the file "scripts/notes.ts" contains:
      """
      /** {@link Nowhere} */
      export const z = 0;
      """
    When the script "check-doc-links.mjs" runs
    Then it exits with 0 and prints:
      """
      2 {@link} tags resolve
      """
