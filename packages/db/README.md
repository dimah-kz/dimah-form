# @dimah-form/db

FumaDB adapter for dimah-form. Pass `db(client)` as `database`. Custom stores go to `dimahForm({ database })` directly.

```ts
import { DimahFormDB, db } from "@dimah-form/db";
import { dimahForm } from "@dimah-form/server";
import { drizzleAdapter } from "fumadb/adapters/drizzle";

const form = dimahForm({
  database: db(
    DimahFormDB.client(drizzleAdapter({ db: drizzleOrm, provider: "sqlite" })),
  ),
  forms,
});
```

See `examples/next` for Drizzle ORM 1.0 RC + libSQL.
