// @ts-check
import { readdirSync } from "node:fs";
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
const tierB = ["src/main.ts", "src/modules/shared/infrastructure/config.ts"];
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

// TSN-19: a status code is a named constant, never a bare number, where it is set or compared:
// res.status(…) / res.sendStatus(…), and comparisons with anything named *status. Tests are exempt:
// the contract test writes wire values literally on purpose.
const statusLiteral = "Literal[value>=100][value<=599]";
const comparison = "BinaryExpression[operator=/^([=!]==?|[<>]=?)$/]";
const noRawStatusCodes = [
  `CallExpression[callee.property.name=/^(status|sendStatus)$/] > ${statusLiteral}`,
  `${comparison}:matches([left.name=/status$/i], [left.property.name=/status$/i]) > ${statusLiteral}.right`,
  `${comparison}:matches([right.name=/status$/i], [right.property.name=/status$/i]) > ${statusLiteral}.left`,
].map((selector) => ({
  selector,
  message: "Use a StatusCodes constant, not a bare status number (TSN-19)",
}));

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

// Feature modules (MOD-9): every folder under src/modules/ except shared/. docs/architecture.md §4 lists the same set.
const modules = readdirSync("src/modules", { withFileTypes: true })
  .filter((d) => d.isDirectory() && d.name !== "shared")
  .map((d) => d.name);

// FF-1, TSN-17: layer direction from docs/architecture.md §4, inside every module and shared/, plus the module
// composers' two zones (MOD-11). A glob zone is
// matched against the full file path, so each one ends in /** (a bare folder glob matches no file). Adapters are
// reachable only from the composition root (PDM-class-modeled-R9). Zones are resolved paths, so aliases
// cannot bypass them.
const layerZones = [
  {
    target: "./src/modules/*/domain/**",
    from: [
      "./src/modules/*/application/**",
      "./src/modules/*/infrastructure/**",
      "./src/modules/*/interface/**",
    ],
  },
  {
    target: "./src/modules/*/application/**",
    from: ["./src/modules/*/infrastructure/**", "./src/modules/*/interface/**"],
  },
  { target: "./src/modules/*/infrastructure/**", from: ["./src/modules/*/interface/**"] },
  { target: "./src/modules/*/interface/**", from: ["./src/modules/*/infrastructure/**"] },
  {
    target: ["./src/!(CompositionRoot|main).ts", "./src/modules/**"],
    from: ["./src/CompositionRoot.ts", "./src/main.ts"],
  },
  // MOD-11 (wiring shape W2): a module composer at the module root builds its module's use cases and router on
  // adapters it is given, so it never imports one; and no layer imports a composer (only the composition root does).
  {
    target: "./src/modules/*/*Module.ts",
    from: "./src/modules/*/infrastructure/**",
    message:
      "A module composer receives adapters from the composition root (MOD-11, PDM-class-modeled-R9)",
  },
  {
    target: "./src/modules/*/@(domain|application|infrastructure|interface)/**",
    from: "./src/modules/*/*Module.ts",
    message: "Only the composition root imports a module composer (MOD-11)",
  },
];

// Which module may use which: the may-depend-on edges of docs/architecture.md §4. A module that is not
// listed may use none, so a new module starts isolated until an edge is added here and there.
const mayDependOn = { comments: ["documents"] };

// MOD-3, IMP-5, TSN-17: a module reaches another only along an allowed edge and only through its public
// surface, the use cases and their input/output types in application/ (not ports/); any other pair is
// blocked outright, so a dependency cannot point the wrong way. shared/ uses no module (MOD-4).
const moduleZones = [
  ...modules.flatMap((target) =>
    modules
      .filter((from) => from !== target)
      .flatMap((from) =>
        (mayDependOn[target] ?? []).includes(from)
          ? [
              {
                target: `./src/modules/${target}`,
                from: `./src/modules/${from}`,
                except: ["./application"],
                message: `${target} may import only ${from}/application (MOD-3)`,
              },
              {
                target: `./src/modules/${target}`,
                from: `./src/modules/${from}/application/ports`,
                message: `Ports of ${from} are not public (MOD-3)`,
              },
            ]
          : [
              {
                target: `./src/modules/${target}`,
                from: `./src/modules/${from}`,
                message: `${target} may not depend on ${from}: not an edge in docs/architecture.md §4 (MOD-3)`,
              },
            ],
      ),
  ),
  ...modules.map((from) => ({
    target: "./src/modules/shared",
    from: `./src/modules/${from}`,
    message: "shared/ imports no feature module (MOD-4)",
  })),
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
    ignores: ["src/modules/*/interface/**", "src/**/*.test.ts"],
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
    rules: {
      "import-x/no-restricted-paths": ["error", { zones: [...layerZones, ...moduleZones] }],
    },
  },
  {
    files: ["src/**/*.ts"],
    ignores: [...tierB, "src/**/*.test.ts"],
    rules: {
      "no-restricted-syntax": [
        "error",
        ...noFreeFunctions,
        ...noReExports,
        ...noEnums,
        ...noRawStatusCodes,
      ],
    },
  },
  {
    // Tier B files keep free functions but still may not re-export.
    files: tierB,
    rules: { "no-restricted-syntax": ["error", ...noReExports, ...noEnums, ...noRawStatusCodes] },
  },
  {
    files: ["src/modules/*/domain/**/*.ts"],
    ignores: ["src/**/*.test.ts"],
    rules: {
      "no-restricted-syntax": [
        "error",
        ...noFreeFunctions,
        ...noReExports,
        ...domainState,
        ...noEnums,
        ...noRawStatusCodes,
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
