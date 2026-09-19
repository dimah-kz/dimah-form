import { config } from "@workspace/eslint-config/react";
import { defineConfig } from "eslint/config";

export default defineConfig(
  config,
  {
    files: ["src/components/ui/**/*.{ts,tsx}"],
    rules: {
      // Vendor primitives — association and style are shadcn's.
      "jsx-a11y/label-has-associated-control": "off",
      "@typescript-eslint/array-type": "off",
      "@typescript-eslint/consistent-type-imports": "off",
      eqeqeq: "off",
    },
  },
  {
    files: ["scripts/**/*.{js,mjs,ts}"],
    rules: {
      "n/no-process-exit": "off",
    },
  },
);
