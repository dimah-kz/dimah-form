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

Until the first `1.0.0` **and until [architecture.md](./architecture.md) Pre-v1 is edited**, a breaking change is allowed. Prefer the clean API over a shim. Still use `major` so the changelog names the break.

## Before opening a PR

```bash
pnpm build
pnpm check-types
pnpm test
```

CI posts a Tegami release preview comment on the PR.

## Maintainer publish flow

After PRs with pending changelogs merge to `main`:

1. The Publish workflow runs `pnpm tegami ci`, writes `.tegami/publish-lock.yaml`, and opens a **Version Packages** PR.
2. Review and merge that PR (bumped versions + lock + changelogs).
3. The next Publish run publishes to npm, creates the shared git tag (`dimah-form@x.y.z`), and a GitHub release.

Failed publishes are safe to retry — the publish lock lives in git.

### First package / npm Trusted Publishers (OIDC)

npm cannot attach a Trusted Publisher until the package name exists on the registry. For a **new** `@dimah-form/*` package (or the first release of this repo):

1. Finish versioning so `.tegami/publish-lock.yaml` exists (`pnpm tegami version`, or merge the Version Packages PR).
2. Log in to npm (`npm login`).
3. Use npm **11.15+** (`npm --version`). Tegami passes `--allow-publish`; npm 11.10 and older reject that flag. Upgrade with `npm install -g npm@11`.
4. From the repo root, run:

```bash
pnpm tegami npm pretrust
```

This publishes a tagged placeholder (`0.0.0-tegami-trusted-publish-setup` on dist-tag `temp`) and registers GitHub Actions OIDC for `publish.yml`. If a placeholder already exists, `pretrust` skips that package — run `npm trust github <name> --repo dimah-kz/dimah-form --file publish.yml --allow-publish -y` for it.

Each published `@dimah-form/*` package needs a [Trusted Publisher](https://docs.npmjs.com/trusted-publishers/) on npmjs.com (Package → Settings → Trusted Publisher):

- **Organization or user:** `dimah-kz`
- **Repository:** `dimah-form`
- **Workflow filename:** `publish.yml`
- **Allowed actions:** `npm publish`

`pretrust` sets this for you when the CLI OTP/2FA prompt succeeds. Missing config makes OIDC token exchange fail with 404.

Do not set `NPM_TOKEN`, `registry-url`, or `NODE_AUTH_TOKEN` on the Publish workflow — they block OIDC.

## Local commands

| Command                    | Purpose                                                     |
| -------------------------- | ----------------------------------------------------------- |
| `pnpm tegami`              | Create a changelog interactively                            |
| `pnpm tegami version`      | Draft bumps and write the publish lock                      |
| `pnpm tegami publish`      | Publish from the publish lock                               |
| `pnpm tegami ci`           | Version if pending, otherwise publish                       |
| `pnpm tegami npm pretrust` | Placeholder + Trusted Publisher for packages not yet on npm |
