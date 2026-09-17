# Architecture

Backend-first questionnaire engine. Consumers own UI, auth, and the database adapter. The library owns the protocol, definition snapshots, and submit validation.

## Package chain

```
@dimah-form/core
        ↓
    @dimah-form/server | @dimah-form/react
        ↑
@dimah-form/db  (peer: server — `db()` adapter for `database`)
```

`apps/` and `examples/*` consume workspace packages (not published) when they exist.

## Placement

Edit the **smallest package that owns the behavior**. Search that package before adding files.

| Package  | Owns                                                            |
| -------- | --------------------------------------------------------------- |
| `core`   | Protocol, `createFormClient`, fill session, errors, field types |
| `server` | HTTP, `dimahForm()`, server plugins, adapters                   |
| `react`  | Thin client hooks / `useFormResponse`                           |
| `db`     | FumaDB `database` adapter                                       |

Shared protocol changes start in `core`, then wire `server` and `react`. Do not copy a parallel schema or URL string into another package.

## Product shape

- Config is instance-based: `dimahForm({ fieldTypes, forms, database, plugins, hooks, guard, metaSchema })`.
- Field types are registered on the instance. `defineForm` does not take `fieldTypes`. Optional `fieldSchema` on `defineFieldType` validates the field document at init / `saveForm`.
- Optional `meta` on the form, field, and option documents is an opaque JSON object for consumer UI. Type-specific keys stay on the field document. Optional `metaSchema.form` / `field` / `option` on `dimahForm()` validate that bag at init / `saveForm`.
- Snapshots include `slug` (defaults to `id`) and `status` (`draft` \| `active` \| `archived`). Only `active` forms can be started. `getForm` / `startResponse` accept id or slug.
- Draft answers are a patch (`null` deletes a key). Submit replaces the whole answers object, or omits `answers` to submit the stored draft. `reopenResponse` returns a submitted or abandoned row to draft without rewriting the snapshot. Optional `updatedAt` on draft/submit/abandon/reopen is optimistic concurrency (`STALE_UPDATE`).
- `database` is required (`memoryAdapter()` or `db()` from `@dimah-form/db`). Plugins merge once in `dimahForm()` and do not replace persistence.
- Code-authored `forms` feed `$Infer`. `getForm` / `startResponse` read config first, then the live questionnaire row. `saveForm` writes that row and cannot overwrite a code-authored id.
- Browser `$Infer` is `createFormClient<typeof form>()` (type-only). Apps import from `server` or `react`; `core` is protocol/plugin internals.
- Filling a response is headless: `createFormResponseSession` in core, `useFormResponse` in react. Consumers own widgets. A later UI package should wrap `FormFieldBinding` / `FormResponseApi`, not fork this loop.
- Each response stores the definition it was started with. Submit validates that snapshot. Starting a response does not rewrite the live questionnaire row.
- Domain hooks: `on*` after validation before persist; `after*` after persist. Auth stays in `guard`.
- Custom fields are `defineFieldType` validators, not components.
- Server plugins may add `endpoints`, `hooks`, `fieldTypes`, and `$ERROR_CODES`. Optional `dependsOn` (topological order), `options`, and synchronous `init` (`{ context }` → `config.pluginContext`). Browser companions use `defineClientPlugin` on `createFormClient({ plugins })`. They are not inferred from the server plugin.

## Do not

- Put auth inside `@dimah-form/server` or `@dimah-form/core` — consumer `guard` hooks.
- Import ORM / FumaDB from `server`.
- Import `react` from `server` or `core`.
- Ship field widgets or a form renderer.
- Add a questionnaire version table unless a stable public form URL with history is an explicit product requirement.
- Inject persistence through `plugins` — that slot is additive features only.
