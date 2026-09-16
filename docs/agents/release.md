# Release & Tegami

All `@dimah-form/*` published packages version **together** (`group: dimah-form` with `syncBump` / `syncGitTag` in `scripts/tegami.mts`).

Format details: [Tegami changelogs](https://tegami.fuma-nama.dev/changelog). Do not edit `.tegami/publish-lock.yaml` or package `CHANGELOG.md` files directly.

## When to add a changelog

Add one when any published package changes **behavior, public API, or build output**:

```bash
pnpm tegami
```

Or write a Markdown file under `.tegami/` as `YYYY-MM-DD-{hash}.md`. Prefer `group:dimah-form` when the whole line should bump.

Skip for repo-only docs, CI/config, or typos with no package output impact.

Frontmatter needs `packages`. Body needs at least one `#` / `##` / `###` heading. Write from the **npm consumer** perspective.

```md
---
packages:
  group:dimah-form: patch
---

### Fix submit validation for hidden fields

Hidden answers are stripped before persist.
```

Package references: `"@dimah-form/core"`, `"npm:@dimah-form/core"`, or `"group:dimah-form"` (preferred for line-wide bumps).

## Bump types

| Type  | When                                      |
| ----- | ----------------------------------------- |
| patch | Fix, internal-safe improvement            |
| minor | Backward-compatible feature               |
| major | Breaking API, types, or consumer contract |

## Before opening a PR

```bash
pnpm build
pnpm check-types
pnpm test
```

## Maintainer publish flow

After PRs with pending changelogs merge to `main`:

1. A publish workflow runs `pnpm tegami ci`, writes `.tegami/publish-lock.yaml`, and opens a **Version Packages** PR.
2. Review and merge that PR (bumped versions + lock + changelogs).
3. The next publish run publishes to npm and creates the shared git tag (`dimah-form@x.y.z`).
