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
  guard: async ({ request, operation }) => {
    /* auth */
  },
  hooks: {
    onSubmit: async ({ response }) => {
      /* side effects */
    },
  },
});
```

Code-authored `forms` are optional. Dynamic questionnaires use `saveForm` / `getForm` against `database`.
