import { createCli } from "fumadb/cli";
import type { InferFumaDB } from "fumadb";

import type { DimahFormDB } from "./fuma-db";

declare const __DIMAH_FORM_DB_VERSION__: string;

/** Run the interactive FumaDB CLI (generate schema, migrate when using Kysely, etc.). */
export function runCli(db: InferFumaDB<typeof DimahFormDB>) {
  const { main } = createCli({
    db,
    command: "dimah-form-db",
    description: "FumaDB CLI for @dimah-form/db",
    version: __DIMAH_FORM_DB_VERSION__,
  });

  return main();
}
