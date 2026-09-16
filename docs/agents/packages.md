# Published packages

Explore the package you are changing. This file is what to **keep in sync**, not an API reference.

## Protocol

Keep these in lockstep (same paths, same payloads — no duplicate route strings):

1. `@dimah-form/core` — route constants, Zod schemas, types, `createFormClient`
2. `@dimah-form/server` — endpoint handlers. The HTTP router is internal; do not export it.
3. `@dimah-form/react` — React `createFormClient` / hooks

Browser client uses object args; server `form.api` is the better-call map. Match existing call sites.

Consumer apps import from the package they already use: `@dimah-form/server` in server modules, `@dimah-form/react` in UI. `core` is for protocol/plugin authors.

`createFormClient<typeof form>()` (or `createFormClient<Form>()` with `export type Form = typeof form`) copies server `$Infer` onto the client. Do not pass the server instance at runtime.

Packages are unpublished — no changelog until first npm release ([AGENTS.md](../../AGENTS.md)).

## Endpoint

1. Add the handler next to existing ones under `packages/server/src/`.
2. Register it the same way current endpoints are registered.
3. Auth and side effects belong in consumer `guard` / `on*` / `after*` hooks, not new library auth.

New HTTP adapter: add it next to existing files in `packages/server/src/adapters/`, export from `package.json`, prefer structural types (no framework peer deps). Public entry stays `dimahForm(config)`.

## Database

First-class `database` on `dimahForm()`. Official adapters: `memoryAdapter()` in `@dimah-form/server`, `db()` in `@dimah-form/db`. A custom `ResponseStore` is allowed — pass it to `database` directly, not through `db()`. Do not inject persistence through plugins.

`getForm` / `startResponse` resolve code-authored `forms` first (id then slug), then `database.getForm`. `saveForm` upserts the live questionnaire. Starting a response inserts the parent questionnaire row if it is missing and never overwrites the live definition.

`deleteForm` refuses code-authored ids and forms that still have responses (archive via `status` instead). `listResponses` defaults to summaries; `include=full` returns stored answers.

## Field types

`defineFieldType` lives in `@dimah-form/core` and is re-exported from `server` / `react`. Register extra types on `dimahForm({ fieldTypes })` — that instance is the registry. Built-ins are field types too; duplicate `type` strings throw at init.

`defineForm` does not take `fieldTypes`. Unknown types are allowed in the document and rejected at `dimahForm()` if unregistered. Optional `fieldSchema` is applied at init / `saveForm`.

Draft is a patch (`null` deletes a key). Submit is a full replace, or omit `answers` to submit the stored draft. `reopenResponse` returns submitted / abandoned to draft; answers and the snapshot stay.

## Plugin

Feature plugins live in their own package and peer-depend on server.

- Merge once in `dimahForm()` — never inside an endpoint.
- Plugins may add `endpoints` (via `createFormEndpoint`), `hooks`, and `fieldTypes`.
- Browser companions are `defineClientPlugin` merged in `createFormClient({ plugins })`. They are not inferred from the server plugin.
- Keep ORM off the client entry.
- Persistence is `database`, not a plugin.

## Strings and errors

Stable `code` + English `message` in `@dimah-form/core`. Do not localize library error `message` strings in packages.
