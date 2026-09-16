# @dimah-form/server

`dimahForm()` — HTTP `handler` and better-call `api`.

```ts
import { dimahForm, memoryAdapter } from "@dimah-form/server";
import { db, DimahFormDB } from "@dimah-form/db";

const tests = dimahForm({
  database: memoryAdapter(),
  forms,
});

const prod = dimahForm({
  database: db(DimahFormDB.client(adapter)),
  forms,
});
```
