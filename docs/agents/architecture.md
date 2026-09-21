# Architecture

Backend-first questionnaire engine. Consumers own auth and the database adapter. UI is optional (`@dimah-form/ui`) — headless `react` is enough. The library owns the protocol, definition snapshots, and submit validation.

## Package chain

```
@dimah-form/core
        ↓
    @dimah-form/server | @dimah-form/react  ←  @dimah-form/ui
        ↑                    ↑
@dimah-form/db         @dimah-form/scoring
(peer: server)         (peer: server / core)
                       @dimah-form/dataset
                       (depends on scoring; peer: server / core)
                       @dimah-form/insights
                       (depends on scoring; peer: server / core)
```

`apps/docs` and `examples/*` consume workspace packages (not published). Registry item manifests: `packages/ui/scripts/` (see [registry.md](./registry.md)).

## Placement

Edit the **smallest package that owns the behavior**. Search that package before adding files.

| Package    | Owns                                                              |
| ---------- | ----------------------------------------------------------------- |
| `core`     | Protocol, `createFormClient`, fill session, errors, field types   |
| `server`   | HTTP, `dimahForm()`, server plugins, adapters                     |
| `react`    | Thin client hooks / `useFormResponse`                             |
| `ui`       | Optional components + registry source                             |
| `db`       | FumaDB `database` adapter                                         |
| `scoring`  | Official scoring plugin (`meta.scoring` — Likert + option keying) |
| `dataset`  | Official dataset plugin (JSONL + codebook, compute-on-read)       |
| `insights` | Official insights plugin (read-side counts from snapshots)        |

Shared protocol changes start in `core`, then wire `server` and `react`. Do not copy a parallel schema or URL string into another package.

## Product shape

- Config is instance-based: `dimahForm({ fieldTypes, forms, database, plugins, hooks, guard, metaSchema, validateAnswers, validateDefinition })`.
- Field types are registered on the instance. `defineForm` does not take `fieldTypes` at runtime. Optional `fieldSchema` on `defineFieldType` validates the field document at init / `saveForm` and feeds `FormDefinitionFor` / `createDefineForm({ fieldTypes })` (type-only).
- Optional `meta` on the form, field, and option documents is an opaque JSON object for consumer UI and plugin namespaces. Type-specific keys stay on the field document (boolean `unsetOnOff` is one). Optional `metaSchema.form` / `field` / `option` on `dimahForm()` and on plugins validate that bag at init / `saveForm`. Plugin `metaNamespace` owns one key (`meta.scoring`). `@dimah-form/ui` types the bag as `FormDefinitionUi<typeof fieldTypes, typeof plugins>` (`satisfies` on `defineForm` / `createDefineForm`; import from `@dimah-form/ui/types` on the server). `createDefineForm({ fieldTypes, plugins })` merges plugin field types and `$Meta`.
- Snapshots include `slug` (defaults to `id`) and `status` (`draft` \| `active` \| `archived`). Only `active` forms can be started. `getForm` / `startResponse` accept id or slug.
- Draft answers are a patch (`null` deletes a key). Submit replaces the whole answers object, or omits `answers` to submit the stored draft. `reopenResponse` returns a submitted or abandoned row to draft without rewriting the snapshot. Optional `updatedAt` on draft/submit/abandon/reopen/`saveForm` is optimistic concurrency (`STALE_UPDATE`) enforced in the store (`expectedUpdatedAt`). `startResponse({ resume: true, respondentId })` uses `findLatestDraft` / `getOrCreateDraft` so concurrent resumes converge on one row.
- `database` is required (`memoryAdapter()` or `db()` from `@dimah-form/db`). Plugins merge once in `dimahForm()` and do not replace persistence. `listResponses({ include: "summary" })` omits `definition` / `answers` at the adapter.
- Filling a response is headless: `createFormResponseSession` in core, `useFormResponse` in react. Optional `@dimah-form/ui` wraps `FormFieldBinding` / `FormResponseApi` as `binding` / `form`. It does not call the hook or fork the loop. Consumers may still own widgets. Optional `autosave` debounces `saveDraft` (`state.autosave` is whether it is on). Local edits during an in-flight save are kept (`dirty`). Session request failures expose `error` plus `errorCode` / `errorParams`. `validate(mode, { fields })` can check a wizard step.
- Field `showWhen` is sibling visibility on that snapshot. Nested rules follow the parent. Leaf rules: `equals` / `notEquals` / `includes` (scalar or non-empty scalar list). Compound: `all` / `any`. Hidden answers are stripped before validate / persist.
- Domain hooks: `on*` after validation before persist; `after*` after persist. Every hook receives `getPluginContext` for values returned from plugin `init`. Auth stays in `guard`. Guard may load rows via `getResponse` / `getForm` (store, no HTTP re-entry).
- Code-authored `forms` feed `$Infer`. `getForm` / `startResponse` read config first, then the live questionnaire row. `saveForm` writes that row and cannot overwrite a code-authored id.
- Browser `$Infer` is `createFormClient<typeof form>({ fieldTypes })` (type-only). Apps import from `server` or `react`; `core` is protocol/plugin internals and shared field-type modules. Plugin endpoint names need `createFormClient<Form, typeof plugins>({ plugins })` once the server generic is set — they are not inferred from the server plugin.
- Each response stores the definition it was started with. Submit validates that snapshot. Starting a response does not rewrite the live questionnaire row.
- Custom fields are `defineFieldType` validators in `core` (optional `format` for `formatAnswer`). Optional UI widgets register by the same `type` string, or a `meta.widget` key. `@dimah-form/ui` types the `meta` bag as `FormDefinitionUi<typeof fieldTypes>` (`@dimah-form/ui/types` on the server).
- Server plugins may add `endpoints`, `hooks`, `fieldTypes`, `$ERROR_CODES`, `metaSchema` / `metaNamespace`, `validateAnswers`, `validateDefinition`, and phantom `$Meta`. Optional `dependsOn` (topological order), `options`, and synchronous `init` (`basePath`, `fieldTypes`, `getPluginContext`). `metaSchema`, `validateAnswers`, and `validateDefinition` merge in `dimahForm()` like field types and hooks. Namespaced `meta` schemas run on `meta[namespace]` only when that key is present. `validateDefinition` is synchronous and runs at init, `saveForm`, and live form reads — not on response snapshots. Browser companions use `defineClientPlugin` on `createFormClient({ plugins })` and may list the same `fieldTypes`, `validateAnswers`, and `$Meta`. They are not inferred from the server plugin.

## Pre-v1

Until the first `1.0.0` **and until this section is edited**, breaking changes are allowed. Do not keep a dual API, compatibility shim, or leftover path just to avoid a break. If the old architecture would only stay for compatibility, remove it and land the cleaner shape. Still changelog the contract change (`major` — [release.md](./release.md)).

## Do not

- Put auth inside `@dimah-form/server` or `@dimah-form/core` — consumer `guard` hooks.
- Import ORM / FumaDB from `server`.
- Import `ui` or `react` from `server` or `core`.
- Put field widgets in `react` — they belong in `ui` (`FieldWidgetRegistry`).
- Hand-edit `packages/ui/registry.json` or `packages/ui/src/components/ui/` ([registry.md](./registry.md)).
- Add a questionnaire version table unless a stable public form URL with history is an explicit product requirement.
- Inject persistence through `plugins` — that slot is additive features only.
