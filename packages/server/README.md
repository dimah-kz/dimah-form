# @dimah-form/server

`dimahForm()` — HTTP `handler` and better-call `api`.

## Install

```bash
pnpm add @dimah-form/server
```

`database` is required. A SQL database is not. `memoryAdapter()` is enough to start; `@dimah-form/db` is optional production SQL.

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

## Plugins

Feature plugins are factories that return `definePlugin({ ... })`. They add endpoints, hooks, field types, and error codes — not persistence.

```ts
import {
  createFormEndpoint,
  defineErrorCodes,
  definePlugin,
  dimahForm,
  memoryAdapter,
} from "@dimah-form/server";

const PING_ERROR_CODES = defineErrorCodes({ PING_FAILED: "Ping failed" });

export const ping = (options?: { token?: string }) =>
  definePlugin({
    id: "ping",
    options,
    $ERROR_CODES: PING_ERROR_CODES,
    endpoints: {
      ping: createFormEndpoint("/ping", { method: "GET" }, async () => ({
        ok: true,
      })),
    },
  });

export const form = dimahForm({
  database: memoryAdapter(),
  plugins: [ping()],
});
```

Pair with `defineClientPlugin({ id: "ping", $ERROR_CODES: PING_ERROR_CODES, endpoints, fieldTypes })` on `createFormClient({ plugins })`. The client companion is never inferred from the server instance. Plugin endpoints should throw `errors.*` from this package.

## License

MIT
