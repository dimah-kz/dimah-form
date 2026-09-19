# @dimah-form/db

Optional production SQL adapter for [dimah-form](https://github.com/dimah-kz/dimah-form). Pass `db(client)` as `database`. Quickstart uses `memoryAdapter()` from `@dimah-form/server` instead.

**Docs:** [Database](https://form.dimah.dev/docs/database)

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

Schemas: [`drizzle.ts`](./src/schema/examples/drizzle.ts) · [`schema.prisma`](./src/schema/examples/schema.prisma) · [`indexes.sql`](./src/schema/examples/indexes.sql)

## License

MIT
