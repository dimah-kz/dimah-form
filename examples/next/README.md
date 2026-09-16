# Next.js example

Workspace demo for `@dimah-form/*`. You own the UI; the library owns snapshots, drafts, and submit validation.

Persistence is [FumaDB](https://github.com/fuma-nama/fumadb) + [Drizzle ORM 1.0 RC](https://orm.drizzle.team) + local SQLite (`local.db`).

```bash
pnpm install
pnpm build
pnpm --filter @dimah-form/example-next db:generate
pnpm --filter @dimah-form/example-next db:push
pnpm --filter @dimah-form/example-next dev
```

Open http://localhost:3001

- `/` lists active forms
- `/f/onboarding` — built-in field types, rendered with shadcn `Field` widgets, plus a live answers preview
- Save draft patches answers; Submit sends the current answers
- `/responses` lists stored answers (`include=full`)
- `/r/:id` resumes a draft or shows a submitted response
