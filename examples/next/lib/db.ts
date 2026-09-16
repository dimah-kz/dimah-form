import { createClient } from "@libsql/client";
import { DimahFormDB } from "@dimah-form/db";
import { drizzle } from "drizzle-orm/libsql";
import { drizzleAdapter } from "fumadb/adapters/drizzle";
import path from "node:path";

import { relations } from "./schema";

const url = `file:${path.join(process.cwd(), "local.db")}`;

const sqlite = createClient({ url });
const orm = drizzle({ client: sqlite, relations });

export const formDb = DimahFormDB.client(
  drizzleAdapter({
    db: orm,
    provider: "sqlite",
  }),
);
