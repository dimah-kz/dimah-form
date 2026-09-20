# Published packages

Explore the package you are changing. This file is what to **keep in sync**, not an API reference.

Until the first `1.0.0` **and until [architecture.md](./architecture.md) Pre-v1 is edited**, breaking changes are allowed. Do not keep old architecture for compatibility.

## Protocol

Keep these in lockstep (same paths, same payloads — no duplicate route strings):

1. `@dimah-form/core` — route constants, Zod schemas, types, `createFormClient`, `createFormResponseSession`
2. `@dimah-form/server` — endpoint handlers. The HTTP router is internal; do not export it.
3. `@dimah-form/react` — React `createFormClient` / `useFormResponse`

Browser client uses object args; server `form.api` is the better-call map. Match existing call sites.

Consumer apps import from the package they already use: `@dimah-form/server` in server modules, `@dimah-form/react` in UI. Shared isomorphic modules (field-type validators used on both sides) import `defineFieldType` from `@dimah-form/core`. Protocol/plugin packages use `core` for schemas, route keys, and plugin internals.

`createFormClient<typeof form>()` (or `createFormClient<Form>()` with `export type Form = typeof form`) copies server `$Infer` onto the client. Do not pass the server instance at runtime. `$Infer` does not install runtime validators — pass the same `fieldTypes` array as `dimahForm({ fieldTypes })`, or register them on `defineClientPlugin({ fieldTypes })`. Filling a response is `useFormResponse` / `createFormResponseSession` — no widgets in this package. Bound `formClient.useFormResponse<"catalogKey">` types answers from `$Infer`; the unbound package hook is the untyped escape hatch and needs `formClient.Provider` or a `client` option. Bound hooks do not need `Provider`.

## Endpoint

1. Add the handler next to existing ones under `packages/server/src/`.
2. Register it the same way current endpoints are registered.
3. Auth and side effects belong in consumer `guard` / `on*` / `after*` hooks, not new library auth.

New HTTP adapter: add it next to existing files in `packages/server/src/adapters/`, export from `package.json`, prefer structural types (no framework peer deps). Public entry stays `dimahForm(config)`.

## Database

First-class `database` on `dimahForm()`. Official adapters: `memoryAdapter()` in `@dimah-form/server`, `db()` in `@dimah-form/db`. A custom `ResponseStore` is allowed — pass it to `database` directly, not through `db()`. Do not inject persistence through plugins.

Copy-paste Drizzle / Prisma / SQL schemas live in `packages/db/src/schema/examples` (published, not imported at runtime). FumaDB `generate` does not emit secondary indexes — keep those in the examples. Docs `_includes/db/` must match those tables and index names.

`deleteForm` refuses code-authored ids and forms that still have responses (archive via `status` instead). `listResponses` defaults to summaries at the HTTP layer; pass `include: "summary"` on the store to skip `definition` / `answers`. `include=full` returns stored answers.

`getForm` / `startResponse` resolve code-authored `forms` first (id then slug), then `database.getForm`. `saveForm` upserts the live questionnaire with optional `expectedUpdatedAt` (`STALE_UPDATE` / `StoreConflictError`). Starting a response inserts the parent questionnaire row if it is missing and never overwrites the live definition. `saveResponse` / `saveForm` take optional `{ expectedUpdatedAt }` so adapters can CAS. Resume uses `findLatestDraft` (newest by `updatedAt`) and `getOrCreateDraft` (oldest-by-`createdAt` race winner; loser deletes duplicate drafts).

## Field types

`defineFieldType` lives in `@dimah-form/core` and is re-exported from `server` / `react`. Optional `format` is an English display string used by `formatAnswer`. Register extra types on `dimahForm({ fieldTypes })` — that instance is the registry. Built-ins are field types too; duplicate `type` strings throw at init. Client plugins may list the same `fieldTypes` so `createFormClient({ plugins })` installs local validators without a second array.

`defineForm` does not take `fieldTypes` at runtime. Unknown types are allowed in the document and rejected at `dimahForm()` if unregistered. Author against `FormDefinitionFor<typeof fieldTypes>` / `createDefineForm({ fieldTypes, plugins })` (type-only — still pass the same array / plugins to `dimahForm` / `createFormClient`) so custom `fieldSchema` keys and plugin `$Meta` autocomplete. `satisfies FormDefinitionUi<typeof fieldTypes, typeof plugins>` adds UI `meta` keys. Optional `fieldSchema` is applied at init / `saveForm`. Optional `meta` on the form, field, and option is opaque JSON for consumer UI and plugin namespaces — not type config. Optional `metaSchema` on `dimahForm()` and on plugins validates that bag at init / `saveForm`. Plugin `metaNamespace` scopes `metaSchema` to `meta[namespace]` when the key is present. Optional `validateDefinition` on `dimahForm()` and on plugins is synchronous (init cannot be async) and runs after `metaSchema` at init, `saveForm`, and live form reads — not on response snapshots. Boolean `unsetOnOff` is a type-specific field key (unchecked → `null`). `showWhen` is sibling visibility: nested rules follow the parent; leaf `equals` / `notEquals` / `includes`; compound `all` / `any`. `defineForm` / `saveForm` reject unknown targets, self-references, cycles, extra keys, and `equals` / `notEquals` against a `multiSelect`. `$Infer` omits required keys that have `showWhen`. Select / multiSelect `$Infer` is the union of `options[].value`. Optional `validateAnswers` on `dimahForm()` / `createFormClient` / the fill session / plugins runs after per-field validators (same snapshot) and may be async. Field `validate` may return a promise. Field issues include stable `code` (`FIELD_ISSUE_CODES`); a string returned from `validate` is `INVALID`.

Draft is a patch (`null` deletes a key). Submit is a full replace, or omit `answers` to submit the stored draft. `reopenResponse` returns submitted / abandoned to draft; answers and the snapshot stay. `startResponse({ resume: true })` requires `respondentId` and returns the latest draft for that pair when one exists (`getOrCreateDraft` if two starts race). Guard receives `getResponse` / `getForm` for ownership checks without HTTP re-entry.

## Plugin

Feature plugins live in their own package and peer-depend on server.

- Merge once in `dimahForm()` — never inside an endpoint.
- Plugins may add `endpoints` (via `createFormEndpoint`), `hooks`, `fieldTypes`, `$ERROR_CODES` (`defineErrorCodes`), `metaSchema` / `metaNamespace`, `validateAnswers`, `validateDefinition`, and phantom `$Meta` (`NamespacedMeta`).
- Optional `dependsOn` (topological `init` / hook / `validateAnswers` / `validateDefinition` / `metaSchema` order), `options` (for sibling plugins), and synchronous `init` that may return `{ context }` stored on `config.pluginContext`.
- Guard `operation` for a plugin route is the `endpoints` key unless `metadata.operation` is set.
- Browser companions are `defineClientPlugin` merged in `createFormClient({ plugins })`. They are not inferred from the server plugin. Share `id` and the error catalog module. Client plugins may add `fieldTypes` (same definitions as the server plugin), `$ERROR_CODES`, `validateAnswers`, and `$Meta`. `createFormClient<Form>({ plugins })` does not infer plugin endpoint names — pass `createFormClient<Form, typeof plugins>({ plugins })`. Without a server generic, `createFormClient({ plugins })` infers them.
- Keep ORM off the client entry.
- Plugin `init` receives `basePath`, `fieldTypes`, sibling `plugins`, and `getPluginContext` — not the internal resolved config. Persistence is `database`, not a plugin. Plugins must not add tables.
- Throw `errors.*` from `@dimah-form/server` (or `APIError.from`) in plugin endpoints.
- First-party `@dimah-form/scoring` is a feature plugin (`meta.scoring`). Likert is `field.variable` plus `option.points`; keying is `option.add` (no field variable, never mixed with `points`). Scores are derived from the response snapshot; do not persist them into `answers` or add scoring tables.

## Strings and errors

Stable `code` + English `message` in `@dimah-form/core`. Do not localize library error `message` strings in `core` / `server` / `react`. `ValidationIssue` carries `code` (and optional `params`) so UIs can localize field errors from the catalog, not from `message`.

Optional UI: `t()` / `useTranslations()` from `@fuma-translate/react` (do not re-export). Then `pnpm --filter @dimah-form/ui compile:translations`. Formatters that map codes to copy must call `useTranslations()` themselves. `FormUiProvider` is the i18n boundary — do not hang translations on `formClient.Provider`.

## UI

Optional. Wrap `form` (`FormResponseApi`) and `binding` (`FormFieldBinding`). Widgets take `{ binding, className, mode? }` and put chrome on `FormFieldFrame` (or `useFieldFrame()` so `components.FieldFrame` applies). Do not call `useFormResponse` inside widgets. Built-in type widgets register on `defaultFieldWidgets`; custom types use the `widgets` prop (same `type` string as `defineFieldType`, or a `meta.widget` key). Built-in `meta.widget` variants (`radio` / `switch` / `chips`) stay on the type widget — they are not registry keys. `FormUiProvider` `components` swaps chrome (`RequiredMark`, `FieldFrame`, `Actions`, `Review`, …). `formatIssue` localizes custom field codes. Built-in widgets read `FieldUiMeta` on `field.meta` (`placeholder`, `widget`, `step`, `section`, `width`, `help`, …). Extra `meta` keys are allowed. Author with `defineForm({ ... } satisfies FormDefinitionUi)`; pass `FormDefinitionUi<typeof fieldTypes, typeof plugins>` when the catalog has custom field types or plugin `$Meta` (`createDefineForm` types those field keys and plugin meta — it does not replace this UI `meta` check). Import `FormDefinitionUi` from `@dimah-form/ui/types` in server form catalogs so the UI runtime stays off the server bundle. `FormView layout` is `auto` (steps when `meta.step` groups; widgets in `mode="review"` when locked). Compact `FormReview` is opt-in (`review={<FormReview />}` or `components.Review`). Slot props take `false` / a node / a wrap function; `render` replaces the template. `FormSteps` is keyed and may be controlled; wrap **around** `FormRoot` so Enter advances. Boolean `unsetOnOff` is a field document key. `session.errorCode` / `session.autosave` feed `FormError` and `FormActions save="auto"`. `validate(mode, { fields })` checks one wizard step.

See [registry.md](./registry.md) for shadcn items, RTL, and color tokens.
