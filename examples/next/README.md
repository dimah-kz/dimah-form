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

- `/` lists **active** forms (`slug` + `status`)
- `/f/onboarding` starts a response (code-authored form: custom `email`, text/number constraints, `select` / `multiSelect`)
- Draft is a patch; **Submit stored draft** omits `answers` so the server submits what was saved
- `/admin` uses the demo `guard` (`x-demo-admin`) plus `saveForm` (slug/status), `listForms`, response summaries or `include=full`, abandon/delete, `deleteForm`, and plugin `ping`
