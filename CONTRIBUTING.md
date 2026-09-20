# Contributing

Thanks for your interest in contributing to this project.

## Prerequisites

- Node.js 24+
- pnpm 12+

## Development setup

```bash
pnpm install
```

## Useful commands

```bash
pnpm build
pnpm check-types
pnpm lint
pnpm format:check
pnpm sherif
pnpm knip
pnpm test
```

`pnpm build` compiles workspace packages, apps, and examples. Run commands for a specific package:

```bash
pnpm --filter @dimah-form/core build
pnpm --filter @dimah-form/core check-types
```

## Issues

Use the **Bug report**, **Feature request**, or **Documentation** forms. Do not file public issues for security problems — see [SECURITY.md](./SECURITY.md).

PRs that touch a published package are labeled `pkg:core`, `pkg:server`, `pkg:db`, `pkg:react`, `pkg:ui`, or `pkg:scoring` from the changed paths.

## Contribution workflow

1. Fork the repository and create a branch from `main`.
2. Make your changes with focused commits.
3. Add or update tests/docs where needed.
4. Add a Tegami changelog for user-facing package changes.
5. Open a Pull Request.

## Changelogs (required for package changes)

When your PR changes behavior, API, or package output, add a changelog:

```bash
pnpm tegami
```

Then choose the package(s) / `group:dimah-form` and bump type:

- `patch`: bug fixes, small improvements, non-breaking behavior updates.
- `minor`: new backward-compatible features.
- `major`: breaking changes.

A changelog file is created in `.tegami/` and must be committed with your PR. CI comments a release preview on the PR.

## How to choose bump type (SemVer standard)

- Choose `patch` if consumers can upgrade safely without changing their code.
- Choose `minor` for additive features (new exports, new options with defaults, improved behavior).
- Choose `major` when existing consumer code may break or output contracts change.

## Pull Request checklist

- [ ] Build passes (`pnpm build`)
- [ ] Type checks pass (`pnpm check-types`)
- [ ] Lint passes (`pnpm lint`)
- [ ] Format check passes (`pnpm format:check`)
- [ ] Workspace checks pass (`pnpm sherif` / `pnpm knip`)
- [ ] Tests pass (`pnpm test`)
- [ ] Docs updated (if needed)
- [ ] Changelog added (if package behavior changed)

## Code of Conduct

By participating, you agree to follow [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md).
