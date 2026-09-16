# @dimah-form/db

FumaDB adapter for dimah-form. Pass `db(client)` as `database`.

```ts
import { DimahFormDB, db } from "@dimah-form/db";
import { dimahForm } from "@dimah-form/server";

const form = dimahForm({
  database: db(DimahFormDB.client(adapter)),
  forms,
});
```
