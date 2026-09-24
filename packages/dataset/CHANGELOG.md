## @dimah-form/dataset@0.6.1

### Clarify public types

Exported types spell out the shapes consumers already use, including `FieldShowWhenCompare`, `ResponseStatus`, and `DimahFormGuardContext`.

## @dimah-form/dataset@0.6.0

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
