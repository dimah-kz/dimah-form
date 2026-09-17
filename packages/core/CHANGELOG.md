## @dimah-form/core@0.0.2

### Align package metadata and TypeScript emit

- npm `author` is `dimah` on every `@dimah-form/*` package.
- `FormField` is a type alias instead of an interface.
- Declaration files use `verbatimModuleSyntax` (type-only imports). Runtime API is unchanged.

## @dimah-form/core@0.0.1

### Initial release

First public release of the dimah-form questionnaire toolkit:

- `@dimah-form/core` — protocol, error catalog, typed fetch client, and headless fill session
- `@dimah-form/server` — `dimahForm()` HTTP `handler` and better-call `api`
- `@dimah-form/db` — FumaDB adapter for questionnaires and responses
- `@dimah-form/react` — thin React client (`createFormClient` / `useFormResponse`)

The library owns definition snapshots, drafts, and submit validation. Consumers own UI, auth, and the database driver.
