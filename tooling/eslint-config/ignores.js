/** Build artifacts, caches, and generated files — shared by all ESLint configs. */
export const ignorePatterns = [
  "**/node_modules/**",
  "**/dist/**",
  "**/.next/**",
  "**/.source/**",
  "**/out/**",
  "**/build/**",
  "**/.turbo/**",
  "**/coverage/**",
  "**/.vitest/**",
  "**/.eslintcache",
  "**/.prettiercache",
  "**/next-env.d.ts",
  "**/tsup.config.bundled_*.mjs",
  "**/.translations/**",
];

/** @type {import("eslint").Linter.Config} */
export const globalIgnores = {
  ignores: ignorePatterns,
};
