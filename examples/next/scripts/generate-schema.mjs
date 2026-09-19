import { copyFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const src = path.resolve(
  here,
  "../../../packages/db/src/schema/examples/drizzle.ts",
);
const dest = path.join(here, "..", "lib", "schema.ts");

copyFileSync(src, dest);
console.log(`Wrote ${dest}`);
