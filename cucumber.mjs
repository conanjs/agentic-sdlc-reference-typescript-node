// Cucumber.js configuration for the repo's own scripts (TST-14): each script's requirements are a feature file in
// scripts/test/, run against fixtures in scripts/test/fixtures/.
export default {
  paths: ["scripts/test/**/*.feature"],
  import: ["scripts/test/support/*.mjs"],
  format: ["progress"],
};
