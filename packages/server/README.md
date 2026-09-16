# @dimah-form/server

`dimahForm()` — HTTP `handler` and better-call `api`.

```ts
import { db, DimahFormDB } from "@dimah-form/db";
import { dimahForm, defineForm, memoryAdapter } from "@dimah-form/server";

const forms = {
  onboarding: defineForm({
    title: "Onboarding",
    fields: [{ id: "name", type: "text", required: true }],
  }),
};

const tests = dimahForm({
  database: memoryAdapter(),
  forms,
});

export const form = dimahForm({
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

export type Form = typeof form;
```

Code-authored `forms` are optional. Dynamic questionnaires use `saveForm` / `getForm` against `database`. Snapshots carry `slug` and `status`. List endpoints are paginated. `reopenResponse` returns a submitted or abandoned response to draft without rewriting its snapshot.
