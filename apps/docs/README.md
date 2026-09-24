# docs

Product documentation site for dimah-form. Built with
[Fumadocs](https://fumadocs.dev) and Next.js App Router.

Canonical production origin: [form.dimah.dev](https://form.dimah.dev).

## Develop

```bash
pnpm --filter @dimah-form/docs dev
```

Open <http://localhost:3000>. Before submitting changes:

```bash
pnpm --filter @dimah-form/docs lint
pnpm --filter @dimah-form/docs check-types
pnpm --filter @dimah-form/docs build
```

## Author content

- Product pages live in [`content/docs`](./content/docs); each `meta.json`
  controls sidebar order.
- Shared database snippets live in
  [`content/_includes/db`](./content/_includes/db) and must match
  `packages/db/src/schema/examples`.
- Prefer `AutoTypeTable` over hand-maintained property tables for public types.
- Landing-page components live in [`src/components/home`](./src/components/home).
- `llms.txt`, `llms-full.txt`, markdown twins, search, sitemap, and Open Graph
  routes are generated from the same source tree.
- Do not hand-edit `public/r`; the UI registry build generates it.

## Explore

| Path                          | Role                          |
| ----------------------------- | ----------------------------- |
| `src/app/(home)`              | Landing page                  |
| `src/app/docs`                | Documentation shell           |
| `src/app/api/search/route.ts` | Search index                  |
| `src/lib/llm-intro.ts`        | Agent decision sheet copy     |
| `src/app/llms*.txt`           | Generated agent-facing routes |
| `next.config.ts`              | Legacy redirects and rewrites |

## Deploy on Vercel

1. Set **Root Directory** to `apps/docs` and enable source files outside it.
2. Use Node.js 24.x.
3. Attach `form.dimah.dev`; the legacy Vercel host redirects there.
4. Production always uses the canonical origin. Set `NEXT_PUBLIC_SITE_URL`
   only for a preview or local tunnel.
5. `vercel.json` owns the monorepo build and unaffected-commit check.
