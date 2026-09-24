# @dimah-form/db

Optional FumaDB SQL adapter for
[dimah-form](https://github.com/dimah-kz/dimah-form). Pass `db(client)` as the
required `database` option. The Quickstart uses process-local
`memoryAdapter()` instead.

**Documentation:** [Persistence](https://form.dimah.dev/docs/persistence)

## Install

```bash
pnpm add @dimah-form/db fumadb
```

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

Copy or generate the schema for your ORM, then retain the published secondary
indexes:

[`drizzle.ts`](./src/schema/examples/drizzle.ts) ·
[`schema.prisma`](./src/schema/examples/schema.prisma) ·
[`indexes.sql`](./src/schema/examples/indexes.sql)

## License

MIT
