/** @type {import("prettier").Config & import("prettier-plugin-tailwindcss").PluginOptions} */
const config = {
  semi: true,
  singleQuote: false,
  trailingComma: "all",
  tabWidth: 2,
  printWidth: 80,
  endOfLine: "lf",
  arrowParens: "always",
  bracketSameLine: false,
  // packagejson first; tailwind must stay last so it can process class lists.
  plugins: ["prettier-plugin-packagejson", "prettier-plugin-tailwindcss"],
  tailwindStylesheet: "./examples/next/app/globals.css",
  tailwindFunctions: ["cn", "cva"],
  overrides: [
    {
      files: ["**/*.md"],
      options: { proseWrap: "preserve" },
    },
    {
      files: ["**/*.{yml,yaml}"],
      options: { singleQuote: false },
    },
    {
      files: ["apps/docs/**/*.{js,jsx,ts,tsx,css}"],
      excludeFiles: ["**/src/components/ui/**"],
      options: {
        tailwindFunctions: ["cn", "cva"],
        tailwindStylesheet: "./apps/docs/src/app/global.css",
      },
    },
    {
      files: ["**/src/components/ui/**/*.{ts,tsx}"],
      options: { plugins: ["prettier-plugin-packagejson"] },
    },
  ],
};

export default config;
