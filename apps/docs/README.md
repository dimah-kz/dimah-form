# docs

Product documentation site for dimah-form. Built with
[Fumadocs](https://fumadocs.dev) and Next.js App Router.

Canonical production origin: [form.dimah.dev](https://form.dimah.dev).

## Deploy on Vercel

1. **Root Directory:** `apps/docs` (enable _Include source files outside of the Root Directory_).
2. **Node.js:** `24.x` in Vercel (matches `engines.node` `>=24` and CI).
3. **Domain:** attach `form.dimah.dev` to the production deployment.
4. **Environment variables:** production canonical is always `https://form.dimah.dev` (see [`.env.example`](./.env.example)). Set `NEXT_PUBLIC_SITE_URL` only on preview / local tunnel.
5. `vercel.json` pins install/build for the monorepo (`turbo run build --filter=@dimah-form/docs` from the repo root) and skips unaffected commits via `ignoreCommand` (`npx turbo-ignore`).

Run development server:

```bash
pnpm --filter @dimah-form/docs dev
```

Open http://localhost:3000

## Explore

| Route                     | Description                    |
| ------------------------- | ------------------------------ |
| `app/(home)`              | Landing page                   |
| `app/docs`                | Documentation layout and pages |
| `app/api/search/route.ts` | Search index                   |
| `llms.txt`                | Agent decision sheet           |
