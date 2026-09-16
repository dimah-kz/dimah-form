# Next.js example

Workspace demo for `@dimah-form/*`. You own the UI; the library owns snapshots, drafts, and submit validation.

Reads go through `form.api` in Server Components (`{ query }` / `{ body }`). Writes go through `createFormClient<Form>()` in the browser (object args). Persistence is [FumaDB](https://github.com/fuma-nama/fumadb) + [Drizzle ORM 1.0 RC](https://orm.drizzle.team) + local SQLite (`local.db`).

```bash
pnpm install
pnpm build
pnpm --filter @dimah-form/example-next db:generate
pnpm --filter @dimah-form/example-next db:push
pnpm --filter @dimah-form/example-next dev
```

Open http://localhost:3001

- `/` lists active forms
- `/f/onboarding` — built-in field types (including `email`, `date`, and `showWhen`), rendered with shadcn `Field` widgets
- Save draft patches answers; Submit replaces them. Both send `updatedAt` for optimistic concurrency
- `/responses` lists stored answers (`include=full`)
- `/r/:id` resumes a draft or shows a submitted / abandoned response. Edit calls `reopenResponse` (same snapshot and answers) — it does not start a new response
