import type { KnipConfig } from "knip";

const config: KnipConfig = {
  ignore: ["**/components/ui/**"],
  ignoreUnresolved: ["next"],
  ignoreIssues: {
    "packages/**": ["exports", "types", "duplicates", "nsExports", "nsTypes"],
    "apps/**": ["exports", "types", "files"],
    "examples/**": ["exports", "types", "files"],
  },
};

export default config;
