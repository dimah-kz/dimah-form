# Next.js example

Workspace demo of `@dimah-form/ui` on a headless `useFormResponse` session. Custom
`rating` is a server validator plus a widget — not a library field.

```
lib/form.ts              dimahForm() + database + scoringPlugin + datasetPlugin
lib/client.ts            createFormClient<Form, typeof plugins>() + scoring + dataset client plugins
lib/forms/               defineForm (feedback, onboarding, GAD-7)
lib/field-types.ts       defineFieldType("rating")
components/providers.tsx theme + FormUiProvider
components/questionnaire.tsx  FormView + chrome around app layout
components/scores-preview.tsx live score from snapshot + answers
components/fields/       widget for type "rating" (same string as the validator)
```

`FormView` is the default template; this app uses `render` so the Card and
answers preview stay around the library chrome.

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

- `/` — catalog. Feedback is a single page; Onboarding is a stepped wizard (`meta.step`); GAD-7 is a scored Likert questionnaire (`@dimah-form/scoring`)
- `/f/:formId` fills one questionnaire. Built-in types plus `showWhen`; `rating` is the only custom type
- Save draft patches answers; Submit replaces them. Both send `updatedAt` for optimistic concurrency
- `/responses` lists stored answers (`include=full`) and dataset downloads (`JSONL` / `CSV`) per form
- `GET /api/forms/:formId/package` is a **consumer** download route (`createDatasetReader` + `toJsonl` / `toCsv`). It is not a library zip.
- `/r/:id` resumes a draft or shows a submitted / abandoned response. Edit calls `reopenResponse` (same snapshot and answers). GAD-7 shows a live score from the snapshot, not from `answers`
