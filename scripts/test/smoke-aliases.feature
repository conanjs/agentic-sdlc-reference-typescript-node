# Requirements for scripts/smoke-aliases.mjs (TSN-15), as executable scenarios (specs/004-script-scenarios).
# Change policy: a changed behavior edits its scenario in the same commit as the script.

Feature: Alias smoke check
  The built dist/ must load with plain Node, which only works when every @/ alias was rewritten to a relative path.

  # dist/ is git-ignored, so the scenarios write the built file themselves rather than keep it as a fixture.
  Background:
    Given the file "dist/CompositionRoot.js" contains:
      """
      // A built composition root whose imports are all relative, as tsc-alias leaves them.
      export {};
      """

  Scenario: A build with relative imports loads
    When the script "smoke-aliases.mjs" runs
    Then it exits with 0 and prints:
      """
      dist/ loads: every alias was rewritten
      """

  Scenario: A build that still imports an @/ alias fails
    Given the file "dist/CompositionRoot.js" contains:
      """
      import "@/modules/documents/domain/Document.js";
      """
    When the script "smoke-aliases.mjs" runs
    Then it exits with 1 and the output contains:
      """
      Cannot find package '@/modules'
      """

  Scenario: A missing build fails
    Given the file "dist/CompositionRoot.js" is removed
    When the script "smoke-aliases.mjs" runs
    Then it exits with 1 and the output contains:
      """
      Cannot find module '{root}/dist/CompositionRoot.js'
      """
