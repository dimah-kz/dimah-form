# dimah-form

<p align="center">
  <img src="apps/docs/src/app/icon.svg" width="64" height="64" alt="dimah-form" />
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@dimah-form/server"><img alt="npm version" src="https://img.shields.io/npm/v/@dimah-form/server?style=flat-square&amp;logo=npm&amp;logoColor=white&amp;label=npm&amp;color=CB3837" /></a>
  <a href="https://github.com/dimah-kz/dimah-form/actions/workflows/ci.yml"><img alt="CI" src="https://img.shields.io/github/actions/workflow/status/dimah-kz/dimah-form/ci.yml?branch=main&amp;style=flat-square&amp;label=CI" /></a>
  <a href="https://github.com/dimah-kz/dimah-form"><img alt="GitHub stars" src="https://img.shields.io/github/stars/dimah-kz/dimah-form?style=flat-square&amp;logo=github&amp;logoColor=white&amp;label=stars&amp;color=F5C518" /></a>
  <a href="https://form.dimah.dev/docs"><img alt="Documentation" src="https://img.shields.io/badge/docs-form.dimah.dev-0F766E?style=flat-square&amp;logo=readthedocs&amp;logoColor=white&amp;label=documentation" /></a>
</p>

**Backend-first questionnaire infrastructure for TypeScript servers and React clients.**

dimah-form owns the typed protocol, per-response definition snapshots, drafts,
and submit validation. Your application supplies authentication, a persistence
adapter, and the interface—or uses the optional `@dimah-form/ui` renderer.

[Documentation](https://form.dimah.dev/docs) ·
[Quickstart](https://form.dimah.dev/docs/quickstart) ·
[Comparison](https://form.dimah.dev/docs/comparison)

## Install

```bash
pnpm add @dimah-form/server @dimah-form/react
pnpm add @dimah-form/ui # optional
```

`database` is required; SQL is not. Use `memoryAdapter()` for tests and
process-local development. For production SQL:

```bash
pnpm add @dimah-form/db fumadb
```

Follow the [Quickstart](https://form.dimah.dev/docs/quickstart) to define a
form, mount a handler, and render a headless fill session.

## Packages

| Package                                                                | Role                                            |
| ---------------------------------------------------------------------- | ----------------------------------------------- |
| [`@dimah-form/core`](https://form.dimah.dev/docs/protocol)             | Protocol, errors, field types, and fetch client |
| [`@dimah-form/server`](https://form.dimah.dev/docs/integration)        | `dimahForm()` HTTP handler and in-process API   |
| [`@dimah-form/react`](https://form.dimah.dev/docs/react)               | Typed protocol client and headless fill hooks   |
| [`@dimah-form/ui`](https://form.dimah.dev/docs/ui)                     | Optional shadcn renderer                        |
| [`@dimah-form/db`](https://form.dimah.dev/docs/persistence)            | Optional FumaDB SQL adapter                     |
| [`@dimah-form/scoring`](https://form.dimah.dev/docs/plugins/scoring)   | Optional scoring plugin                         |
| [`@dimah-form/dataset`](https://form.dimah.dev/docs/plugins/dataset)   | Optional JSONL/codebook interchange             |
| [`@dimah-form/insights`](https://form.dimah.dev/docs/plugins/insights) | Optional snapshot-based summaries               |

Install `@dimah-form/core` directly only for shared field-type modules,
protocol tooling, or plugin authoring. The server and React packages re-export
the app-facing protocol types.

## Run the example

[`examples/next`](./examples/next) combines SQL persistence, the UI package, a
custom field type, scoring, dataset export, and insights.

```bash
pnpm install
pnpm build:packages
pnpm --filter @dimah-form/example-next db:push
pnpm --filter @dimah-form/example-next dev
```

The schema is committed. Run `db:generate` only after changing the canonical
schema under `packages/db`.

## Work on this repository

Requirements and the complete workflow are in
[`CONTRIBUTING.md`](./CONTRIBUTING.md).

```bash
pnpm build
pnpm check-types
pnpm lint
pnpm format:check
pnpm test
```

Product documentation lives in `apps/docs`. Coding agents can fetch
[`llms.txt`](https://form.dimah.dev/llms.txt) or the complete
[`llms-full.txt`](https://form.dimah.dev/llms-full.txt).

Report vulnerabilities through the process in [`SECURITY.md`](./SECURITY.md).

## License

[MIT](./LICENSE)
