import type { KnipConfig } from "knip";

const config: KnipConfig = {
  ignore: ["**/components/ui/**"],
  ignoreUnresolved: ["next"],
  ignoreIssues: {
    "packages/**": ["exports", "types", "duplicates", "nsExports", "nsTypes"],
    "examples/**": ["exports", "types", "files"],
  },
};

export default config;
