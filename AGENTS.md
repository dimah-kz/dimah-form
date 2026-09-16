---
description: dimah-form library monorepo — invariants only; explore src. Packages are unpublished WIP.
alwaysApply: true
---

# dimah-form

This repository **is the library**, not an app.

Explore `packages/*/src` for how things work. [docs/agents/](docs/agents/) is **checklists** — not a map of the repo, and not a substitute for reading the code.

pnpm + Turbo. From the root: `pnpm lint`, `pnpm check-types`, `pnpm test`.

## Not published (edit at first npm release)

`@dimah-form/*` is **not on npm**. The library is still being built.

Until the first publish:

- Do **not** add Tegami changelogs or version bumps.
- Do **not** treat API, schema, or package-export changes as breaking-change work. Reshape freely; match the surrounding code.
- Skip [release.md](docs/agents/release.md).

This section will be rewritten when packages are published.

## Invariants

- Backend-first. No form renderer, no field widgets, no shadcn registry. Consumers own UI.
- Protocol SSOT is `@dimah-form/core`. `server` and `react` must not copy route strings or payload schemas.
- Auth lives in consumer `guard` hooks, not library packages. Persistence is the `database` adapter on `dimahForm()` — `@dimah-form/db` is FumaDB, `memoryAdapter()` is for tests. No ORM inside `server`.
- A response stores a **definition snapshot** plus answers. Submit validates against that snapshot, not the live questionnaire. Do not add a version table unless the product explicitly needs one.
- Custom field types are server validators (`defineFieldType`) that feed `$Infer`. They are not React components.
- API errors: stable `code` + English `message`.
- Deps: `core` ← `server` | `react`; `db` → `server` (peer).
- Commit when asked. Never `git push` (or force-push) unless the human explicitly asks.

`examples/` = workspace demos (when added). `apps/` = product docs (when added). `docs/agents/` = maintainer checklists. `tooling/` = private ESLint / TS / Vitest configs.

## Checklists

Read the matching file when the change matches. Skip it for a local fix — match the surrounding code. **Do not** follow [release.md](docs/agents/release.md) until first publish.

| File                                           | Read when                                       |
| ---------------------------------------------- | ----------------------------------------------- |
| [architecture.md](docs/agents/architecture.md) | New package, or moving behavior across packages |
| [packages.md](docs/agents/packages.md)         | Protocol, endpoint, plugin, or hook             |
