// @ts-check
import js from "@eslint/js";
import prettier from "eslint-config-prettier";
import { createTypeScriptImportResolver } from "eslint-import-resolver-typescript";
import importX from "eslint-plugin-import-x";
import jsdoc from "eslint-plugin-jsdoc";
import tsdoc from "eslint-plugin-tsdoc";
import localDocs from "./eslint/local-docs.mjs";

// require-param / require-returns skip a method that implements an interface member and links it
// (`{@link Port.member}`): the editor shows the port's @param and @returns there (CMT-12, TSN-13).
// local-docs/implementation-summary checks that such a method links its own contract.
const implementing =
  "ClassDeclaration[implements.length>0] > ClassBody > MethodDefinition > FunctionExpression";
const notInheriting = [
  { context: "ArrowFunctionExpression" },
  { context: "FunctionDeclaration" },
  { context: `FunctionExpression:not(${implementing})` },
  {
    context: implementing,
    comment: 'JsdocBlock:not(:has(JsdocInlineTag[tag="link"][namepathOrURL=/\\./]))',
  },
];
import tseslint from "typescript-eslint";

// IMP-1, TSN-16: a relative path may name only a file in the importing file's own folder.
const noRelativeOutsideFolder = {
  regex: "^(\\.\\./|\\./[^/]+/)",
  message: "Use an @/ alias outside the file's own folder (IMP-1)",
};

// PDM-class-modeled-R7: free functions only in the Tier B files listed in docs/architecture.md §7.
const tierB = ["src/main.ts", "src/infrastructure/config.ts"];
// TSN-18: no barrel files. A file never re-exports; import the file that declares the symbol.
const noReExports = [
  {
    selector: "ExportAllDeclaration",
    message: "No re-exports: import the declaring file (TSN-18)",
  },
  {
    selector: "ExportNamedDeclaration[source]",
    message: "No re-exports: import the declaring file (TSN-18)",
  },
];

// TSN-20: no TypeScript enum; it is not erasable. Use an as-const object (reasons and other values
// written in several files) or a literal union. Listed in every block that sets no-restricted-syntax.
const noEnums = [
  {
    selector: "TSEnumDeclaration",
    message: "No enum: use an as-const object or a literal union (TSN-20)",
  },
];

const noFreeFunctions = [
  "Program > FunctionDeclaration",
  "Program > ExportNamedDeclaration > FunctionDeclaration",
  "Program > ExportDefaultDeclaration > FunctionDeclaration",
  "Program > VariableDeclaration > VariableDeclarator[init.type='ArrowFunctionExpression']",
].map((selector) => ({
  selector,
  message: "Tier A code is a class (PDM-class-modeled-R7)",
}));

// PDM-class-modeled-R1: domain state is readonly #fields. These must be repeated with the R7
// selectors because a later block's no-restricted-syntax options replace the earlier ones.
const domainState = [
  {
    selector: "PropertyDefinition[accessibility='private']",
    message: "Domain state uses readonly #fields (PDM-class-modeled-R1)",
  },
  {
    selector: "TSParameterProperty",
    message: "Domain state uses readonly #fields (PDM-class-modeled-R1)",
  },
  {
    selector: "PropertyDefinition:not([readonly=true])",
    message: "Domain state is readonly (PDM-class-modeled-R1)",
  },
];

// FF-1, TSN-17: layer direction from docs/architecture.md §4. Adapters are reachable only from the
// composition root (PDM-class-modeled-R9). Zones are resolved paths, so aliases cannot bypass them.
const layerZones = [
  {
    target: "./src/domain",
    from: ["./src/application", "./src/infrastructure", "./src/interface"],
  },
  {
    target: "./src/application",
    from: ["./src/infrastructure", "./src/interface"],
  },
  { target: "./src/infrastructure", from: ["./src/interface"] },
  { target: "./src/interface", from: ["./src/infrastructure"] },
  {
    target: "./src/!(CompositionRoot|main).ts",
    from: ["./src/CompositionRoot.ts", "./src/main.ts"],
  },
];

export default tseslint.config(
  { ignores: ["dist/", "coverage/", "scripts/"] },
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  { files: ["**/*.mjs"], ...tseslint.configs.disableTypeChecked },
  {
    files: ["src/**/*.ts", "test/**/*.ts"],
    plugins: { "import-x": importX },
    settings: {
      "import-x/extensions": [".ts", ".js"],
      "import-x/resolver-next": [createTypeScriptImportResolver({ project: "tsconfig.json" })],
    },
    rules: {
      "no-restricted-imports": ["error", { patterns: [noRelativeOutsideFolder] }],
      "import-x/no-cycle": "error",
      "no-console": "error",
      // Express recognises error middleware by its four parameters, so `_next` must stay.
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/explicit-member-accessibility": "error",
      "@typescript-eslint/prefer-readonly": "error",
      "@typescript-eslint/no-extraneous-class": [
        "error",
        { allowWithDecorator: true, allowStaticOnly: false },
      ],
    },
  },
  {
    // TSN-19: HTTP status codes are a delivery detail, so the library is used only in interface/.
    // Repeats noRelativeOutsideFolder: a later block's no-restricted-imports options replace earlier ones.
    files: ["src/**/*.ts"],
    ignores: ["src/interface/**", "src/**/*.test.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [noRelativeOutsideFolder],
          paths: [
            {
              name: "http-status-codes",
              message: "Status codes belong to the interface ring; return a Result error (TSN-19)",
            },
          ],
        },
      ],
    },
  },
  {
    // Tests sit outside the layer graph: a use-case test may use the in-memory adapter as its fake.
    files: ["src/**/*.ts"],
    ignores: ["src/**/*.test.ts"],
    rules: { "import-x/no-restricted-paths": ["error", { zones: layerZones }] },
  },
  {
    files: ["src/**/*.ts"],
    ignores: [...tierB, "src/**/*.test.ts"],
    rules: { "no-restricted-syntax": ["error", ...noFreeFunctions, ...noReExports, ...noEnums] },
  },
  {
    // Tier B files keep free functions but still may not re-export.
    files: tierB,
    rules: { "no-restricted-syntax": ["error", ...noReExports, ...noEnums] },
  },
  {
    files: ["src/domain/**/*.ts"],
    ignores: ["src/**/*.test.ts"],
    rules: {
      "no-restricted-syntax": [
        "error",
        ...noFreeFunctions,
        ...noReExports,
        ...domainState,
        ...noEnums,
      ],
    },
  },
  {
    // Tests have no other no-restricted-syntax block, so they get the enum ban on its own.
    files: ["src/**/*.test.ts", "test/**/*.ts"],
    rules: { "no-restricted-syntax": ["error", ...noEnums] },
  },
  {
    // TSN-13, CMT-5, CMT-12: TSDoc on every exported declaration and public member.
    files: ["src/**/*.ts", "test/support/**/*.ts"],
    ignores: ["src/**/*.test.ts"],
    plugins: { jsdoc, tsdoc, "local-docs": localDocs },
    settings: { jsdoc: { mode: "typescript" } },
    rules: {
      "tsdoc/syntax": "error",
      // CMT-13: a summary must add facts beyond the member and class names.
      "local-docs/specific-summary": ["error", { minWords: 3 }],
      // CMT-12: an implementation has its own summary and links the contract it fulfils.
      "local-docs/implementation-summary": "error",
      "jsdoc/require-jsdoc": [
        "error",
        {
          publicOnly: true,
          require: {
            ClassDeclaration: true,
            MethodDefinition: true,
            FunctionDeclaration: true,
          },
          checkGetters: true,
          contexts: [
            "TSInterfaceDeclaration",
            "TSTypeAliasDeclaration",
            "TSMethodSignature",
            "TSPropertySignature",
            "ExportNamedDeclaration > VariableDeclaration",
          ],
        },
      ],
      "jsdoc/informative-docs": "error",
      "jsdoc/require-param": ["error", { checkDestructured: false, contexts: notInheriting }],
      "jsdoc/require-param-description": "error",
      "jsdoc/check-param-names": "error",
      "jsdoc/require-returns": [
        "error",
        { forceReturnsWithAsync: true, checkGetters: false, contexts: notInheriting },
      ],
      "jsdoc/require-returns-description": "error",
    },
  },
  prettier,
);
