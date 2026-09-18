---
description: dimah-form library monorepo — invariants only; explore src, open docs/agents to change published behavior
alwaysApply: true
---

# dimah-form

This repository **is the library**, not an app.

Explore `packages/*/src` for how things work. [docs/agents/](docs/agents/) is **checklists for changing published behavior** — not a map of the repo, and not a substitute for reading the code.

pnpm + Turbo. From the root: `pnpm lint`, `pnpm check-types`, `pnpm test`.

## Invariants

- Backend-first. No form renderer, no field widgets, no shadcn registry. Consumers own UI.
- Protocol SSOT is `@dimah-form/core`. `server` and `react` must not copy route strings or payload schemas.
- Auth lives in consumer `guard` hooks, not library packages. Persistence is the `database` adapter on `dimahForm()` — `@dimah-form/db` is FumaDB, `memoryAdapter()` is for tests. No ORM inside `server`.
- A response stores a **definition snapshot** plus answers. Submit validates against that snapshot, not the live questionnaire. Do not add a version table unless the product explicitly needs one.
- Custom field types are server validators (`defineFieldType`) that feed `$Infer`. They are not React components.
- API errors: stable `code` + English `message`.
- Deps: `core` ← `server` | `react`; `db` → `server` (peer).
- Published `@dimah-form/*` behavior, API, or build output change → changelog under `.tegami/` ([release.md](docs/agents/release.md)). Do not edit `.tegami/publish-lock.yaml` or package `CHANGELOG.md` files.
- Commit when asked. Never `git push` (or force-push) unless the human explicitly asks.

`examples/` = workspace demos. `apps/` = product docs site. `docs/agents/` = these maintainer checklists. `tooling/` = private ESLint / TS / Vitest configs.

## Checklists

Read the matching file **when changing published behavior**. Skip it for a local fix — match the surrounding code.

| File                                           | Read when                                       |
| ---------------------------------------------- | ----------------------------------------------- |
| [architecture.md](docs/agents/architecture.md) | New package, or moving behavior across packages |
| [packages.md](docs/agents/packages.md)         | Protocol, endpoint, plugin, or hook             |
| [release.md](docs/agents/release.md)           | Tegami changelog / version bump                 |
