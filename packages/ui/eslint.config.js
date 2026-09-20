import { config } from "@workspace/eslint-config/react";
import { defineConfig } from "eslint/config";

export default defineConfig(
  config,
  {
    files: ["src/components/ui/**/*.{ts,tsx}"],
    rules: {
      // Vendor primitives — association and style are shadcn's.
      "jsx-a11y/click-events-have-key-events": "off",
      "jsx-a11y/label-has-associated-control": "off",
      "jsx-a11y/no-noninteractive-element-interactions": "off",
      "@typescript-eslint/array-type": "off",
      "@typescript-eslint/consistent-type-imports": "off",
      "@typescript-eslint/no-import-type-side-effects": "off",
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
