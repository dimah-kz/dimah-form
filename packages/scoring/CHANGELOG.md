## @dimah-form/scoring@0.5.0

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
