# dimah-form

**Backend-first questionnaires for the React ecosystem.**

Server instance, typed protocol client, and [FumaDB](https://github.com/fuma-nama/fumadb) persistence via `database`.
You own rendering. The library owns definition snapshots, drafts, and submit validation.

Same stack as [dimah-s3](https://github.com/dimah-kz/dimah-s3): pnpm + Turbo, `better-call`, `@better-fetch/fetch`, Zod, Tegami.

## Packages

| Package              | Role                                           |
| -------------------- | ---------------------------------------------- |
| `@dimah-form/core`   | Protocol, error catalog, typed fetch client    |
| `@dimah-form/server` | `dimahForm()` — HTTP `handler` + `api`         |
| `@dimah-form/db`     | FumaDB adapter for `dimahForm({ database })`   |
| `@dimah-form/react`  | Thin React client (`createFormClient` / hooks) |

There is no UI package. Field widgets stay in the consumer app.

Apps import from the package they already use: `@dimah-form/server` on the server, `@dimah-form/react` in the browser. Share `$Infer` with `export type Form = typeof form` and `createFormClient<Form>()`.

## Example

`examples/next` is a Next.js App Router demo: one code-authored form, shadcn Field widgets, live answer preview, and Drizzle RC + SQLite via FumaDB.

```bash
pnpm install
pnpm build
pnpm --filter @dimah-form/example-next db:push
pnpm --filter @dimah-form/example-next dev
```

## Develop

```bash
pnpm install
pnpm build
pnpm check-types
pnpm lint
pnpm test
```

## License

MIT
