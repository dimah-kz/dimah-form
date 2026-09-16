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
      /* mutate before persist */
    },
    afterSubmit: async ({ response }) => {
      /* side effects after persist */
    },
  },
});
```

Code-authored `forms` are optional. Dynamic questionnaires use `saveForm` / `getForm` against `database`. Snapshots carry `slug` and `status`. List endpoints are paginated.
