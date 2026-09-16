# @dimah-form/db

Optional FumaDB persistence for dimah-form. `db()` replaces the in-memory response store.

```ts
import { DimahFormDB, db } from "@dimah-form/db";
import { dimahForm } from "@dimah-form/server";

const form = dimahForm({
  forms,
  plugins: [db({ client: DimahFormDB.client(adapter) })],
});
```
