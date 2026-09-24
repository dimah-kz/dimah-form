# @dimah-form/server

`dimahForm()` creates the server-authoritative questionnaire instance: a Fetch
`handler`, an in-process `api`, lifecycle hooks, guards, and plugin support.

**Documentation:** [Quickstart](https://form.dimah.dev/docs/quickstart) ·
[Integration](https://form.dimah.dev/docs/integration) ·
[Configuration](https://form.dimah.dev/docs/configuration)

## Install

```bash
pnpm add @dimah-form/server
```

`database` is required; SQL is not. `memoryAdapter()` is intended for tests and
process-local development. Use `@dimah-form/db` or a custom `ResponseStore` for
durable production data.

```ts
import { dimahForm, defineForm, memoryAdapter } from "@dimah-form/server";

const forms = {
  onboarding: defineForm({
    title: "Onboarding",
    fields: [{ id: "name", type: "text", required: true }],
  }),
};

export const form = dimahForm({
  database: memoryAdapter(),
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

Mount `form.handler` directly in a Fetch runtime, or use an adapter from
`@dimah-form/server/next`, `/express`, `/hono`, `/fastify`, `/elysia`,
`/svelte-kit`, or `/node`.

## Plugins

Feature plugins are additive. They may add endpoints, hooks, field types, error
codes, metadata schemas, and validators; persistence remains the `database`
adapter.

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

The endpoint key (`ping`) is the default `guard.operation`. Pair browser
methods with `defineClientPlugin()` using the same id, routes, error catalog,
field types, and validators. Client companions are never inferred from the
server instance.

Official plugins:

- [`@dimah-form/scoring`](https://form.dimah.dev/docs/plugins/scoring)
- [`@dimah-form/dataset`](https://form.dimah.dev/docs/plugins/dataset)
- [`@dimah-form/insights`](https://form.dimah.dev/docs/plugins/insights)

## License

MIT
