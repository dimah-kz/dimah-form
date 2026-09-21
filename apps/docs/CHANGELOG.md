## @dimah-form/docs@0.6.0

### Add `@dimah-form/dataset`

Official dataset plugin. Project stored responses into a versioned **JSONL + codebook** interchange (`spec: "dimah.dataset/v1"`). Records are dense fields from the **response definition snapshot** (never the live form). HTTP is paged (`GET /dataset/responses`, `getDatasetPage`, default `status=submitted`, same 50/100 list limits). `GET /dataset/codebook` is the **live** form only (`snapshots[].n` is 0; the key is the live instrument hash). Full-file zip stays in the consumer app (`createDatasetReader` + `toJsonl` / `toCsv` / `toDataPackage`).

Install `datasetPlugin()` on `dimahForm({ plugins })` and `datasetClientPlugin()` on `createFormClient({ plugins })`. Guard those operations like `listResponses`. The package depends on `@dimah-form/scoring`. `getDatasetPage` attaches `scoreResponse` when the snapshot has `meta.scoring` — scores are not written into `answers`. The plugin does not add tables or a `meta` namespace. `onProject` should upsert by `record.id` (reopen then submit runs it again).

`getDatasetCodebook` is the historical union. Canonical field and score views follow `lastSeenAt`. A prior snapshot that differs is one `history` entry: the full field view (including scoring variable and option `points` / `add`), score-variable `missing` policy, band range, or formula. Query `maxRows` can lower the walk cap (default 10_000), not raise it. `truncated` is returned, including from `readCodebook()`.

`snapshotKey` is SHA-256 of RFC 8785 canonical JSON of the instrument (`title`, `description`, `fields`, `meta`). CSV is RFC 4180 convenience (`multiSelect` joined with `;`; UTF-8 BOM only on `responses.labels.csv`). A field id that collides with an identity column or `score.*` is written as `field.<id>` (encoding throws if that name is also a field). Score columns include `score.<id>.missing`. `toDataPackage()` is a Frictionless tabular data package; the table schema is on `responses.csv` only. `attachment` is set only for `type: "file"`.

This is a **new published package**. After versioning, run `pnpm tegami npm pretrust` so npm Trusted Publisher OIDC can attach (see [release.md](docs/agents/release.md)).

### Export and insights plugins

`listResponses` accepts `submittedFrom` / `submittedTo` (inclusive) and `updatedAfter` (exclusive). The store adds required `countResponses`. List HTTP returns `total`.

`@dimah-form/dataset` is the export surface: historical `getDatasetCodebook`, `onProject`, `updatedAt` / attachment metadata on records, codebook `required` / `showWhen` / constraints, streaming `createDatasetReader`, encode allowlists, and optional scoring via dynamic import.

New `@dimah-form/insights` is the read-side summary plugin (`GET /insights/summary`) — status totals, visible-required completion, categorical counts, and score bands from **response snapshots**. No tables.

Custom `ResponseStore` implementations must add `countResponses`. After versioning, run `pnpm tegami npm pretrust` so npm Trusted Publisher OIDC can attach for the new package (see [release.md](docs/agents/release.md)).

### Insights field stats, crosstab, and capped walks

`@dimah-form/insights` field counts now use **visible** snapshot fields: `n` is the question base, `hidden` is skip-logic, `unanswered` is visible and empty (`isAnswerEmpty`). Categorical `values[].pct` (and score `bands[].pct`) are 0–1; `multiSelect` percentages are of answered respondents. Number fields expose `numeric` (min / max / mean / stdev); date fields expose `dates`. `completion.rate` is `complete / submitted` (or `null`).

`GET /insights/summary` accepts `whereField` + `whereValue`, `bucket=day`, and `maxRows` (cannot raise the plugin cap, default 10_000). The payload includes `scanned` and `truncated`. New `GET /insights/crosstab` (`getFormCrosstab`) folds two categorical fields.

`datasetPlugin({ maxRows })` caps the historical codebook walk; `getDatasetCodebook` includes `truncated`. `@dimah-form/server` exports `resolveLiveForm` and `walkFullResponses` for plugin authors. `@dimah-form/core` exports `isAnswerEmpty` and `resolveFieldTypeRegistry`.

### Insights catalog order

`@dimah-form/insights` categorical `values` and score `bands` follow the document catalog, including unused levels at `n: 0`, in document order rather than by frequency. `fields` follow the live questionnaire; ids that exist only on older snapshots come after. The live form does not invent fields that never appear in the scanned rows.

`numeric` is any finite number answer, including custom field types, not only `type: "number"`. `whereValue` matches a finite number when it equals `String(value)` (`"5"` matches `5`).

`GET /insights/crosstab` adds `n` (respondents who contributed a cell, not multiSelect tokens). Axis totals use the same catalog, with unused `n: 0`. An axis that is on the live form and not categorical is still `VALIDATION_ERROR`. An id missing from the live form still folds from snapshots.

### Align dataset, insights, and file answers with one scoring document

`@dimah-form/dataset` and `@dimah-form/insights` depend on `@dimah-form/scoring`. Import the isomorphic helpers from `@dimah-form/scoring/document` (`readScoringFormMeta`, `readScoringFieldMeta`, `tryScoreResponse`). A scoring validation error on one historical row omits scores. Any other error propagates.

`snapshotKey` is SHA-256 of RFC 8785 canonical JSON. Existing keys change.

`file` is a built-in field type. Answers are metadata (`id`, `url`, `name`, `contentType`, `size`) and cannot include inline bytes. Dataset `attachment` is set only for `type: "file"`. There is no built-in file widget.

`toDataPackage()` uses the Frictionless tabular data package profile. The `responses.csv` schema includes `primaryKey`, quote dialect, and codebook constraints.

Plugin `on*` / `after*` hooks receive `getPluginContext`. Insights day series takes an IANA `timeZone` (default `UTC`) and returns it on `series`. Crosstab axes are categorical per response snapshot. A non-categorical live field no longer rejects the query.

## @dimah-form/docs@0.5.0

### Plugin `metaSchema`, `validateAnswers`, and `$Meta`

Plugins merge `metaSchema` / `metaNamespace` and `validateAnswers` in `dimahForm()` the same way they already merge field types and hooks. A namespaced schema validates `meta.scoring` (and similar) only when that key is present, so opt-in plugins do not reject plain forms. `createDefineForm({ plugins })` and `FormDefinitionUi<typeof fieldTypes, typeof plugins>` pick up phantom `$Meta` — use `NamespacedMeta` so plugin keys sit next to UI `meta`. Client plugins may list the same `validateAnswers` and `$Meta`.

### Add `@dimah-form/scoring`

Official scoring plugin. Named variables accumulate option points (and mapped number / boolean values) from the **response definition snapshot**. Likert is `field.variable` plus `option.points`. Keying is `option.add: [{ variable, points }]` — exclusive with `points`, and the field must not set `variable`. Scores are derived — they are not stored in `answers` and the plugin does not add tables.

Install `scoringPlugin()` on `dimahForm({ plugins })` and `scoringClientPlugin()` on `createFormClient({ plugins })`. Author `meta.scoring` with `createDefineForm({ plugins })`. Read totals with isomorphic `scoreResponse(definition, answers)` or `GET /scoring/response` (`getResponseScores`). Persist to your own database in `onScore` (runs from `afterSubmit`).

Missing items default to `"incomplete"` (`raw: null`), including when every contributing item is hidden. Reverse scoring is `min + max - points` using that field's option range for Likert select items, or `field.min` / `field.max` for number items (`option.add` is not reversed; `multiSelect` reverse is rejected). Every variable must be mapped (`SCORING_UNUSED_VARIABLE`). Bands are interpretation. Optional typed `formulas: [{ op: "sum", vars }]` can combine subscales. Formula `vars` must be unique variable ids — not other formulas.

### Plugin `validateDefinition`

Server plugins and `dimahForm({ validateDefinition })` may run whole-document checks after namespaced `metaSchema`. The callback is synchronous (init cannot be async). It runs at init, `saveForm`, and when reading a live questionnaire (`getForm` / `listForms` / `startResponse`). Response snapshots are not re-checked. Use this for cross-field mapping (unknown or unused `meta.scoring` variables) — not for answer validation.

### Client plugins with `createFormClient<typeof form>()`

`createFormClient({ plugins })` infers plugin endpoint names from the `plugins` array. Once you pass a server generic, TypeScript does not infer later type parameters — use `createFormClient<Form, typeof plugins>({ plugins })` for literal names such as `getResponseScores`.

## @dimah-form/docs@0.4.0

### Type-safe form documents for custom field types

- `FormDefinitionFor<typeof fieldTypes>` / `FieldDocumentFor` type built-in field keys and extra `defineFieldType` `fieldSchema` keys. Unregistered `type` strings stay on `defineForm` only.
- `createDefineForm({ fieldTypes })` is a type-only `defineForm` bound to that list. It does not register validators — pass the same array to `dimahForm({ fieldTypes })` and `createFormClient({ fieldTypes })`.
- `FormDefinitionUi<typeof fieldTypes>` (from `@dimah-form/ui/types`) is the same field document plus UI `meta` keys. It does not replace `createDefineForm`. Skip `FormDefinitionUi` when you are not using `@dimah-form/ui`. `defineForm` itself stays a loose runtime parser.
- **Breaking (types):** `satisfies FormDefinitionUi` no longer accepts unregistered custom `type` strings. Pass `FormDefinitionUi<typeof fieldTypes>`. Headless catalogs can type those fields with `createDefineForm({ fieldTypes })` instead.

## @dimah-form/docs@0.3.1

### Improve UI layout, stepper design, and save state placement

- `FormView` puts `FormSaveState` in the header. `FormUiProvider` `components.Header` / `components.SaveState` swap those pieces; `FormHeader` `saveState` follows the same slot rules as other chrome.
- Stepped layouts show `FormStepList` (`ToggleGroup`, named or “Step N of M”) and omit the progress bar and `FormStepHeading` unless `stepList={false}`. `FormProgress` still measures a wizard page when composed inside `FormSteps`.
- Skip a `meta.section` heading when it repeats the current step title. Field groups use `gap-6`.
- `FormStepNav` stays layout-agnostic (no decorative top border). Parent chrome owns the separator, matching `FormActions`.
- Choice options use a pointer cursor; field description / help sit one size down from the label.

## @dimah-form/docs@0.3.0

### Add optional `@dimah-form/ui`

Optional shadcn questionnaire renderer on top of `useFormResponse`. Install from npm or the shadcn registry. Headless `@dimah-form/react` is unchanged.

### Tighten the client fill path

Bound `useFormResponse<"catalogKey">` types answers from `$Infer`. `FormView` locked review renders widgets (`mode="review"`); compact `FormReview` is opt-in. `stepList` follows the same slot rules as other chrome. Built-in `meta.widget` variants (`radio` / `switch` / `chips`) stay on the type widget and are not registry keys.

### Align package seams



### Shared app protocol on server and react

Apps import protocol helpers from `@dimah-form/server` or `@dimah-form/react`. Both re-export `@dimah-form/core/app-protocol`. `@dimah-form/core` stays for plugin authors and shared `defineFieldType` modules.

### Field types: `format` and client plugin registries

`defineFieldType` accepts optional `format` (English display string). `formatAnswer` / review use it when `fieldTypes` are passed. `defineClientPlugin` accepts `fieldTypes` and merges them the same way server plugins do. `$Infer` from `createFormClient<Form>()` is still type-only — pass `fieldTypes` or a client plugin for local validation.

### `ResponseStore` response methods

`create` / `get` / `save` / `delete` are now `createResponse` / `getResponse` / `saveResponse` / `deleteResponse`. Questionnaire methods stay `*Form`. `findLatestDraft` is newest-by-`updatedAt`; `getOrCreateDraft` keeps the oldest-by-`createdAt` race winner.

### Plugin author surface

`errors` is exported from `@dimah-form/server`. Plugin `init` receives `basePath`, `fieldTypes`, sibling `plugins`, and `getPluginContext` — not the internal resolved config.

### UI types entry

`import type { FormDefinitionUi } from "@dimah-form/ui/types"` in server form catalogs. `fieldsUseHalfWidth` is removed (`fieldsUseGrid`). `@dimah-form/db` peers on `@dimah-form/server` with `workspace:^`.

### Swap the required-field mark from FormUiProvider

Pass `components.RequiredMark` to render your own required indicator on every `FormFieldFrame`. Per-field `requiredIndicator={false}` still hides it.

### Replace hand-rolled fill chrome with shadcn

`@dimah-form/ui` now composes shadcn `Progress`, `InputGroup`, `Item`, `Badge`, `ButtonGroup`, `Empty`, and `ToggleGroup` instead of custom affix, meter, review list, save hint, step jump list, and inactive markup.

`FieldControlAffix` is removed — wrap controls in shadcn `InputGroup` (`InputGroupInput` / `InputGroupAddon` / `InputGroupText`). `FormProgressClassNames` is removed; style `FormProgress` with `className` or `[data-slot=form-progress]`. Compact `FormReview` renders an `Item` list. Default `FormActions` buttons sit in a `ButtonGroup`. `FormInactive` is an `Empty` state.

### Open the UI renderer for composition and per-field widgets

`FormView` `render` and wrap-style slots keep the default chrome while swapping layout. Widgets resolve `meta.widget` before `field.type`. `FormSteps` is keyed from the snapshot (controlled `step` / `onStepChange`) so `showWhen` does not reset the page. `FormUiProvider` `components` and `formatIssue` swap frame/actions/review copy without forking. Built-in widgets honor `mode="review"`. `FormRoot` / `FormActions` use Base UI `render`. Extra `field.meta` keys type-check; `help`, `width: "third"`, and `FormActions` `before` / `after` are supported.

### Add fill chrome, layout primitives, and widget variants

`FormProgress`, `FormSaveState`, and `FormReview` wrap session completion, dirty drafts, and `formatAnswer`. `FormSteps` groups `meta.step`; `FormFields` can filter ids and group `meta.section`. Built-in widgets read `meta.placeholder` and `meta.widget` (`radio`, `switch`, `chips`). Submit focuses the first invalid control.

### Improve fill template, typed UI meta, and session errors

`FormView` infers `layout` (`fill` / `steps` / `review`). Wizard Next validates the current step; Enter advances when `FormSteps` wraps `FormRoot`. Field `meta` is a typed `FieldUiMeta` bag (`width`, `prefix` / `suffix`, …). Type-check a document with `defineForm({ ... } satisfies FormDefinitionUi)` from `@dimah-form/ui`. Step headings live on `form.meta.steps`. Boolean `unsetOnOff` is a field key: off writes `false` unless set, then `null`. Session state exposes `errorCode` and `autosave` so the UI can localize request errors and hide Save draft during autosave.

### Add built-in UI field widgets and composition primitives

`FormView` is a template over `FormScope`, `FormRoot`, `FormFields`, and chrome slots. Built-in types render through a widget registry; custom types register once on `FormUiProvider`.

Field widgets receive `{ binding, className }`. `FormFieldFrame` covers stack / choice / group chrome so custom widgets reuse the same label and issue markup.

## @dimah-form/docs@0.2.0

### Typed fill, visibility, and store concurrency



### Issues, `$Infer`, and answer parsing

`ValidationIssue` includes a stable `code` and optional `params` (`FIELD_ISSUE_CODES`). Select `$Infer` is a union of option values. Required keys with `showWhen` are omitted from `$Infer`. Date fields accept `min` / `max`.

`parseAnswers` drops empty values (blank text, empty `multiSelect`), not only `null` / `undefined`. `parseAnswers`, `assertAnswers`, `collectAnswerIssues`, field `validate`, and `validateAnswers` may be async. `validateAnswers` on the instance, client, and fill session runs after per-field validators. After a failed submit, `validate: "change"` keeps `REQUIRED` until the field is filled.

### `showWhen`

Nested `showWhen` follows the parent field. Conditions support `all` / `any` / `notEquals`, and `equals` / `includes` accept a non-empty scalar list (one-of / any-of). `defineForm` and `saveForm` reject unknown targets, self-references, cycles, extra keys, and `equals` against a `multiSelect`. `field(id).required` is true only while the field is visible.

### Store CAS, resume, and listing

`ResponseStore.save` and `saveForm` take `{ expectedUpdatedAt }` and throw `StoreConflictError` (`STALE_UPDATE`). `saveForm` re-reads the stored form so the concurrency token matches the adapter. The FumaDB adapter treats a stale CAS write as a conflict even when answers already match.

`startResponse({ resume: true, respondentId })` returns the latest draft for that pair via `findLatestDraft` / `getOrCreateDraft`. `listResponses({ include: "summary" })` skips snapshot JSON at the adapter. `listForms` pages from the store window so skipped invalid rows do not collapse `nextOffset`. `guard` receives `getResponse` / `getForm` (store reads, no HTTP re-entry).

### Fill session

`useFormResponse<Form["$Infer"]["answers"][key]>()` types the session. Session state includes `issueParams` and `completion`. `validate()` is async; `autosave` debounces `saveDraft`; local edits during an in-flight save are kept. Headless helpers: `emptyToNull`, `formatAnswer`, `formCompletion`.

### Database schema examples and CLI

`@dimah-form/db` ships copy-paste Drizzle, Prisma, and SQL schemas (with recommended indexes) and `runCli` from `@dimah-form/db/cli` for FumaDB generate / migrate.

## @dimah-form/docs@0.1.0

### Require Node.js 24 and ES2025

Published packages compile to ES2025. The repo Node.js baseline is 24 or later.
