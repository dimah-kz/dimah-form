// @ts-check

import eslintComments from "@eslint-community/eslint-plugin-eslint-comments/configs";
import js from "@eslint/js";
import vitest from "@vitest/eslint-plugin";
import { defineConfig, globalIgnores } from "eslint/config";
import eslintConfigPrettier from "eslint-config-prettier/flat";
import importX from "eslint-plugin-import-x";
import n from "eslint-plugin-n";
import packageJson from "eslint-plugin-package-json";
import { configs as pnpmConfigs } from "eslint-plugin-pnpm";
import regexp from "eslint-plugin-regexp";
import turboPlugin from "eslint-plugin-turbo";
import unicorn from "eslint-plugin-unicorn";
import globals from "globals";
import tseslint from "typescript-eslint";

import { errorifyRules } from "./errorify.js";
import { ignorePatterns } from "./ignores.js";

const turboRecommended = turboPlugin.configs["flat/recommended"];
const regexpRecommended = regexp.configs["flat/recommended"];
const jsTsFiles = ["**/*.{js,mjs,cjs,ts,tsx,mts,cts}"];

/** Shared rules without Prettier — compose into React/Next, then append Prettier last. */
export const baseConfig = defineConfig(
  globalIgnores(ignorePatterns),
  {
    name: "workspace/linter-options",
    linterOptions: {
      reportUnusedDisableDirectives: "error",
      reportUnusedInlineConfigs: "error",
    },
  },
  {
    name: "workspace/js-ts",
    files: jsTsFiles,
    extends: [
      js.configs.recommended,
      tseslint.configs.strict,
      tseslint.configs.stylistic,
    ],
  },
  {
    name: "workspace/typescript-overrides",
    files: jsTsFiles,
    rules: {
      "@typescript-eslint/consistent-type-definitions": ["error", "type"],
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],
      "@typescript-eslint/no-import-type-side-effects": "error",
      "@typescript-eslint/no-dynamic-delete": "off",
      // Dual sync/async adapter APIs (`void | Promise<void>`).
      "@typescript-eslint/no-invalid-void-type": "off",
    },
  },
  {
    name: "workspace/typescript-type-checked",
    files: ["**/*.{ts,tsx,mts}"],
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: [
            "*.mjs",
            "*.js",
            "eslint.config.js",
            "tsup.config.ts",
            "vitest.config.ts",
          ],
        },
      },
    },
    rules: {
      "@typescript-eslint/await-thenable": "error",
      "@typescript-eslint/consistent-type-exports": [
        "error",
        { fixMixedExportsWithInlineTypeSpecifier: true },
      ],
      "@typescript-eslint/no-array-delete": "error",
      "@typescript-eslint/no-base-to-string": "error",
      "@typescript-eslint/no-confusing-void-expression": [
        "error",
        { ignoreArrowShorthand: true },
      ],
      "@typescript-eslint/no-duplicate-type-constituents": "error",
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-for-in-array": "error",
      "@typescript-eslint/no-implied-eval": "error",
      "@typescript-eslint/no-meaningless-void-operator": "error",
      "@typescript-eslint/no-misused-promises": "error",
      "@typescript-eslint/no-unnecessary-boolean-literal-compare": "error",
      "@typescript-eslint/no-unnecessary-template-expression": "error",
      "@typescript-eslint/only-throw-error": "error",
      "@typescript-eslint/prefer-promise-reject-errors": "error",
      "@typescript-eslint/related-getter-setter-pairs": "error",
      "@typescript-eslint/restrict-plus-operands": "error",
      "@typescript-eslint/restrict-template-expressions": [
        "error",
        { allowNumber: true, allowBoolean: true },
      ],
      "@typescript-eslint/return-await": ["error", "in-try-catch"],
      "@typescript-eslint/switch-exhaustiveness-check": [
        "error",
        { considerDefaultExhaustiveForUnions: true },
      ],
    },
  },
  {
    ...turboRecommended,
    name: "workspace/turbo",
    files: jsTsFiles,
    rules: errorifyRules(turboRecommended.rules),
  },
  {
    name: "workspace/import-x",
    files: jsTsFiles,
    plugins: {
      "import-x": importX,
    },
    rules: {
      "import-x/first": "error",
      "import-x/newline-after-import": "error",
      "import-x/no-duplicates": "error",
      "import-x/no-empty-named-blocks": "error",
      "import-x/no-extraneous-dependencies": [
        "error",
        {
          packageDir: process.cwd(),
          devDependencies: [
            "**/*.{test,spec}.{js,jsx,mjs,cjs,ts,tsx}",
            "**/eslint.config.js",
            "**/prettier.config.mjs",
            "**/scripts/**",
            "**/test/**",
            "**/*.config.ts",
            "knip.config.ts",
          ],
        },
      ],
      "import-x/no-self-import": "error",
      "import-x/no-useless-path-segments": "error",
    },
  },
  {
    name: "workspace/unicorn",
    files: jsTsFiles,
    plugins: {
      unicorn,
    },
    rules: {
      "unicorn/consistent-existence-index-check": "error",
      "unicorn/error-message": "error",
      "unicorn/no-await-in-promise-methods": "error",
      "unicorn/no-lonely-if": "error",
      "unicorn/no-new-buffer": "error",
      "unicorn/no-single-promise-in-promise-methods": "error",
      "unicorn/no-unnecessary-await": "error",
      "unicorn/no-useless-fallback-in-spread": "error",
      "unicorn/no-useless-length-check": "error",
      "unicorn/no-useless-promise-resolve-reject": "error",
      "unicorn/no-useless-spread": "error",
      "unicorn/prefer-array-find": "error",
      "unicorn/prefer-array-flat": "error",
      "unicorn/prefer-array-flat-map": "error",
      "unicorn/prefer-array-index-of": "error",
      "unicorn/prefer-array-some": "error",
      "unicorn/prefer-date-now": "error",
      "unicorn/prefer-includes": "error",
      "unicorn/prefer-logical-operator-over-ternary": "error",
      "unicorn/prefer-node-protocol": "error",
      "unicorn/prefer-number-properties": "error",
      "unicorn/prefer-optional-catch-binding": "error",
      "unicorn/prefer-regexp-test": "error",
      "unicorn/prefer-set-has": "error",
      "unicorn/prefer-string-replace-all": "error",
      "unicorn/prefer-string-slice": "error",
      "unicorn/prefer-string-starts-ends-with": "error",
      "unicorn/prefer-structured-clone": "error",
      "unicorn/prefer-type-error": "error",
      "unicorn/throw-new-error": "error",
    },
  },
  {
    name: "workspace/n",
    files: jsTsFiles,
    plugins: {
      n,
    },
    rules: {
      "n/hashbang": "error",
      "n/no-deprecated-api": "error",
      "n/no-exports-assign": "error",
      "n/no-process-exit": "error",
      "n/prefer-node-protocol": "error",
    },
  },
  {
    ...regexpRecommended,
    name: "workspace/regexp",
    files: jsTsFiles,
    rules: errorifyRules(regexpRecommended.rules),
  },
  {
    name: "workspace/javascript-quality",
    files: jsTsFiles,
    rules: {
      curly: ["error", "multi-line", "consistent"],
      eqeqeq: ["error", "always", { null: "ignore" }],
      "no-useless-rename": "error",
      "object-shorthand": ["error", "always"],
      "prefer-const": ["error", { destructuring: "all" }],
    },
  },
  {
    name: "workspace/node-scripts",
    files: ["**/*.{js,mjs,cjs}"],
    languageOptions: {
      globals: globals.node,
    },
  },
  {
    ...vitest.configs.recommended,
    name: "workspace/vitest",
    files: ["**/*.{test,spec}.{js,jsx,mjs,cjs,ts,tsx}"],
    rules: {
      ...errorifyRules(vitest.configs.recommended.rules),
      "vitest/consistent-test-it": ["error", { fn: "it" }],
      "vitest/no-alias-methods": "error",
      "vitest/no-commented-out-tests": "error",
      "vitest/prefer-hooks-in-order": "error",
      "vitest/prefer-hooks-on-top": "error",
      "vitest/prefer-mock-promise-shorthand": "error",
      "vitest/prefer-spy-on": "error",
      "vitest/prefer-to-be": "error",
      "vitest/prefer-to-contain": "error",
      "vitest/prefer-to-have-length": "error",
      "vitest/expect-expect": [
        "error",
        {
          assertFunctionNames: ["expect", "expectCode", "expectErrorCode"],
        },
      ],
    },
  },
  {
    name: "workspace/eslint-comments",
    files: jsTsFiles,
    ...eslintComments.recommended,
    rules: {
      ...errorifyRules(eslintComments.recommended.rules),
      "@eslint-community/eslint-comments/require-description": "error",
    },
  },
  {
    name: "workspace/package-json",
    extends: [packageJson.configs.recommended],
    files: ["package.json"],
    settings: {
      packageJson: {
        enforceForPrivate: false,
      },
    },
    rules: {
      // Prettier (`prettier-plugin-packagejson`) owns key/collection order.
      "package-json/order-properties": "off",
      "package-json/sort-collections": "off",
    },
  },
  ...pnpmConfigs.json,
  {
    name: "workspace/pnpm-catalog-overrides",
    files: ["package.json"],
    rules: {
      // Alias to a TS 6 build for typescript-eslint (`npm:`), not the catalog TS 7.
      // Shared deps already use `catalog:`; example-only UI packages stay local.
      "pnpm/json-enforce-catalog": "off",
    },
  },
  ...pnpmConfigs.yaml,
  {
    name: "workspace/pnpm-yaml-overrides",
    files: ["pnpm-workspace.yaml"],
    rules: {
      // `apps/*` is product docs; keep valid even if the glob is empty.
      "pnpm/yaml-valid-packages": "off",
    },
  },
);

/** Shared config for Node/TS packages. Prettier last so it disables formatting rules. */
export const config = defineConfig(baseConfig, eslintConfigPrettier);
