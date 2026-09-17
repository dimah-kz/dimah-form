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
  ],
};

export default config;
