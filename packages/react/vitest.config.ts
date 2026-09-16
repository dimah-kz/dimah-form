import { packageConfig } from "@workspace/vitest-config";

export default packageConfig(import.meta.dirname, {
  name: "react",
  include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
});
