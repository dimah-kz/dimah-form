# Architecture

Backend-first questionnaire engine. Consumers own UI, auth, and the database adapter. The library owns the protocol, definition snapshots, and submit validation.

## Package chain

```
@dimah-form/core
        ↓
@dimah-form/server | @dimah-form/react
        ↑
@dimah-form/db  (peer: server — `db()` plugin)
```

`apps/` and `examples/*` consume workspace packages (not published) when they exist.

## Placement

Edit the **smallest package that owns the behavior**. Search that package before adding files.

| Package  | Owns                                              |
| -------- | ------------------------------------------------- |
| `core`   | Protocol, `createFormClient`, errors, field types |
| `server` | HTTP, `dimahForm()`, server plugins, adapters     |
| `react`  | Thin client Provider / hooks                      |
| `db`     | Optional FumaDB persistence plugin                |

Shared protocol changes start in `core`, then wire `server` and `react`. Do not copy a parallel schema or URL string into another package.

## Product shape

- Config is instance-based: `dimahForm({ fieldTypes, forms, plugins, db })`.
- Plugins merge once in `dimahForm()`. `db()` may replace the in-memory response store (one store plugin).
- Code-authored `forms` feed `$Infer`. Dynamic (DB-only) forms are runtime-validated.
- Each response stores the definition it was started with. Live questionnaire updates do not rewrite old answers.
- Custom fields are `defineFieldType` validators, not components.

## Do not

- Put auth inside `@dimah-form/server` or `@dimah-form/core` — consumer `guard` hooks.
- Import ORM / FumaDB from `server`.
- Import `react` from `server` or `core`.
- Ship field widgets or a form renderer.
- Add a questionnaire version table unless a stable public form URL with history is an explicit product requirement.
