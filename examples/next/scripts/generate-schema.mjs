import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@libsql/client";
import { DimahFormDB } from "@dimah-form/db";
import { drizzle } from "drizzle-orm/libsql";
import { drizzleAdapter } from "fumadb/adapters/drizzle";

const sqlite = createClient({ url: "file:local.db" });
const orm = drizzle({ client: sqlite });
const client = DimahFormDB.client(
  drizzleAdapter({
    db: orm,
    provider: "sqlite",
  }),
);

const generated = client.generateSchema("1.0.0");
const dest = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "lib",
  "schema.ts",
);
const code = generated.code
  .replace(/import \{ createId \} from "fumadb\/cuid"\n/, "")
  .replaceAll(
    ".$defaultFn(() => createId())",
    ".$defaultFn(() => crypto.randomUUID())",
  );
writeFileSync(dest, code);
console.log(`Wrote ${dest}`);
