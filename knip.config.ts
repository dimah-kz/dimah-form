import type { KnipConfig } from "knip";

const config: KnipConfig = {
  ignore: ["**/components/ui/**", "packages/ui/.translations/**"],
  ignoreDependencies: ["tailwindcss"],
  ignoreUnresolved: ["next"],
  ignoreIssues: {
    "packages/**": ["exports", "types", "duplicates", "nsExports", "nsTypes"],
    // Published copy-paste schemas — not imported at runtime.
    "packages/db/src/schema/examples/**": ["files"],
    "apps/**": ["exports", "types", "files"],
    "examples/**": ["exports", "types", "files"],
  },
};

export default config;
