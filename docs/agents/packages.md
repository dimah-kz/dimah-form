# Published packages

Explore the package you are changing. This file is what to **keep in sync**, not an API reference.

## Protocol

Keep these in lockstep (same paths, same payloads — no duplicate route strings):

1. `@dimah-form/core` — route constants, Zod schemas, types, `createFormClient`, `createFormResponseSession`
2. `@dimah-form/server` — endpoint handlers. The HTTP router is internal; do not export it.
3. `@dimah-form/react` — React `createFormClient` / `useFormResponse`

Browser client uses object args; server `form.api` is the better-call map. Match existing call sites.

Consumer apps import from the package they already use: `@dimah-form/server` in server modules, `@dimah-form/react` in UI. `core` is for protocol/plugin authors.

`createFormClient<typeof form>()` (or `createFormClient<Form>()` with `export type Form = typeof form`) copies server `$Infer` onto the client. Do not pass the server instance at runtime.

Pass the same `fieldTypes` array as `dimahForm({ fieldTypes })` on `createFormClient({ fieldTypes })` so `useFormResponse` can validate locally. Filling a response is `useFormResponse` / `createFormResponseSession` — no widgets in this package.

## Endpoint

1. Add the handler next to existing ones under `packages/server/src/`.
2. Register it the same way current endpoints are registered.
3. Auth and side effects belong in consumer `guard` / `on*` / `after*` hooks, not new library auth.

New HTTP adapter: add it next to existing files in `packages/server/src/adapters/`, export from `package.json`, prefer structural types (no framework peer deps). Public entry stays `dimahForm(config)`.

## Database

First-class `database` on `dimahForm()`. Official adapters: `memoryAdapter()` in `@dimah-form/server`, `db()` in `@dimah-form/db`. A custom `ResponseStore` is allowed — pass it to `database` directly, not through `db()`. Do not inject persistence through plugins.

`getForm` / `startResponse` resolve code-authored `forms` first (id then slug), then `database.getForm`. `saveForm` upserts the live questionnaire with optional `expectedUpdatedAt` (`STALE_UPDATE` / `StoreConflictError`). Starting a response inserts the parent questionnaire row if it is missing and never overwrites the live definition. `save` / `saveForm` take optional `{ expectedUpdatedAt }` so adapters can CAS. Resume uses `findLatestDraft` and `getOrCreateDraft` (loser deletes duplicate drafts).

`deleteForm` refuses code-authored ids and forms that still have responses (archive via `status` instead). `listResponses` defaults to summaries at the HTTP layer; pass `include: "summary"` on the store to skip `definition` / `answers`. `include=full` returns stored answers.

## Field types

`defineFieldType` lives in `@dimah-form/core` and is re-exported from `server` / `react`. Register extra types on `dimahForm({ fieldTypes })` — that instance is the registry. Built-ins are field types too; duplicate `type` strings throw at init.

`defineForm` does not take `fieldTypes`. Unknown types are allowed in the document and rejected at `dimahForm()` if unregistered. Optional `fieldSchema` is applied at init / `saveForm`. Optional `meta` on the form, field, and option is opaque JSON for consumer UI — not type config. Optional `metaSchema` on `dimahForm()` validates that bag at init / `saveForm`. `showWhen` is sibling visibility: nested rules follow the parent; leaf `equals` / `notEquals` / `includes`; compound `all` / `any`. `defineForm` / `saveForm` reject unknown targets, self-references, cycles, extra keys, and `equals` / `notEquals` against a `multiSelect`. `$Infer` omits required keys that have `showWhen`. Select / multiSelect `$Infer` is the union of `options[].value`. Optional `validateAnswers` on `dimahForm()` / `createFormClient` / the fill session runs after per-field validators (same snapshot) and may be async. Field `validate` may return a promise. Field issues include stable `code` (`FIELD_ISSUE_CODES`); a string returned from `validate` is `INVALID`.

Draft is a patch (`null` deletes a key). Submit is a full replace, or omit `answers` to submit the stored draft. `reopenResponse` returns submitted / abandoned to draft; answers and the snapshot stay. `startResponse({ resume: true })` requires `respondentId` and returns the latest draft for that pair when one exists (`getOrCreateDraft` if two starts race). Guard receives `getResponse` / `getForm` for ownership checks without HTTP re-entry.

## Plugin

Feature plugins live in their own package and peer-depend on server.

- Merge once in `dimahForm()` — never inside an endpoint.
- Plugins may add `endpoints` (via `createFormEndpoint`), `hooks`, `fieldTypes`, and `$ERROR_CODES` (`defineErrorCodes`).
- Optional `dependsOn` (topological `init` / hook order), `options` (for sibling plugins), and synchronous `init` that may return `{ context }` stored on `config.pluginContext`.
- Guard `operation` for a plugin route is the `endpoints` key unless `metadata.operation` is set.
- Browser companions are `defineClientPlugin` merged in `createFormClient({ plugins })`. They are not inferred from the server plugin. Share `id` and the error catalog module.
- Keep ORM off the client entry.
- Persistence is `database`, not a plugin. Plugins must not add tables.

## Strings and errors

Stable `code` + English `message` in `@dimah-form/core`. Do not localize library error `message` strings in packages. `ValidationIssue` carries `code` (and optional `params`) so UIs can localize field errors from the catalog, not from `message`.
