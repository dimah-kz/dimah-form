# Next.js example

Workspace demo of `@dimah-form/ui` on a headless `useFormResponse` session. One
code-authored form: a scored weekly pulse. Custom `rating` is a server validator
plus a widget — not a library field.

```
lib/form.ts              dimahForm() + database + scoring + dataset + insights
lib/client.ts            createFormClient<Form, typeof plugins>()
lib/forms/pulse.ts       defineForm — Likert scoring, showWhen, stepped layout
lib/field-types.ts       defineFieldType("rating")
components/questionnaire.tsx  FormView chrome around the fill session
components/fields/       widget for type "rating" (same string as the validator)
```

Reads go through `form.api` in Server Components (`{ query }` / `{ body }`).
Writes go through `createFormClient<Form>()` in the browser. Persistence is
[FumaDB](https://github.com/fuma-nama/fumadb) + [Drizzle ORM 1.0 RC](https://orm.drizzle.team) +
local SQLite (`local.db`).

```bash
pnpm install
pnpm build
pnpm --filter @dimah-form/example-next db:generate
pnpm --filter @dimah-form/example-next db:push
pnpm --filter @dimah-form/example-next dev
```

Open http://localhost:3000 — header toggle switches light / dark (`next-themes`).

- `/` — overview of the demo and live insights
- `/f/pulse` fills the check-in. Step 1 is identity (`showWhen` on Engineer → team). Step 2 is four scored Likert items plus a custom star rating that is stored but **not** scored
- Save draft patches answers; submit replaces them. Both send `updatedAt` for optimistic concurrency. Autosave is on; abandon and reopen are on the action bar
- `/responses` lists stored rows with per-response scores, submitted insights (status, completion rate, field counts, score bands), and dataset downloads (`JSONL` / `CSV` / codebook)
- `GET /api/forms/:formId/package` is a **consumer** download route. It streams `createDatasetReader` + `createCsvEncoder` / `toJsonlLine`, or returns `getDatasetCodebook`. It is not a library zip
- `/r/:id` resumes a draft or shows a submitted / abandoned response. Edit calls `reopenResponse` (same snapshot and answers). The live score is computed from the snapshot, not from `answers`
