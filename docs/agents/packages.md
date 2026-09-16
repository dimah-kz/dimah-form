# Published packages

Explore the package you are changing. This file is what to **keep in sync**, not an API reference.

## Protocol

Keep these in lockstep (same paths, same payloads — no duplicate route strings):

1. `@dimah-form/core` — route constants, Zod schemas, types, `createFormClient`
2. `@dimah-form/server` — endpoint handlers. The HTTP router is internal; do not export it.
3. `@dimah-form/react` — React `createFormClient` / hooks

Browser client uses object args; server `form.api` is the better-call map. Match existing call sites.

Changelog: [release.md](./release.md).

## Endpoint

1. Add the handler next to existing ones under `packages/server/src/`.
2. Register it the same way current endpoints are registered.
3. Auth and side effects belong in consumer `guard` / `on*` hooks, not new library auth.

New HTTP adapter: add it next to existing files in `packages/server/src/adapters/`, export from `package.json`, prefer structural types (no framework peer deps). Public entry stays `dimahForm(config)`.

## Plugin

Feature plugins (like `db()`) live in their own package and peer-depend on server.

- Merge once in `dimahForm()` — never inside an endpoint.
- Keep ORM off the client entry.

## Strings and errors

Stable `code` + English `message` in `@dimah-form/core`. Do not localize library error `message` strings in packages.
