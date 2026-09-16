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
pnpm test
```

Run commands for a specific package:

```bash
pnpm --filter @dimah-form/core build
pnpm --filter @dimah-form/core check-types
```

## Contribution workflow

1. Fork the repository and create a branch from `main`.
2. Make your changes with focused commits.
3. Add or update tests/docs where needed.
4. Open a Pull Request.

## Changelogs

Packages are **not published yet**. Skip Tegami changelogs and version bumps until the first npm release (see `AGENTS.md`). The rest of this section applies after that.

```bash
pnpm tegami
```

Then choose the package(s) / `group:dimah-form` and bump type:

- `patch`: bug fixes, small improvements, non-breaking behavior updates.
- `minor`: new backward-compatible features.
- `major`: breaking changes.

A changelog file is created in `.tegami/` and must be committed with your PR.

## Pull Request checklist

- [ ] Build passes (`pnpm build`)
- [ ] Type checks pass (`pnpm check-types`)
- [ ] Lint passes (`pnpm lint`)
- [ ] Tests pass (`pnpm test`)
- [ ] Docs updated (if needed)

## Code of Conduct

By participating, you agree to follow [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md).
