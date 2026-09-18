# `@workspace/typescript-config`

Shared TypeScript configuration for the monorepo (`tooling/typescript-config`).

| Preset               | Use for                                                        |
| -------------------- | -------------------------------------------------------------- |
| `base.json`          | Strict defaults (NodeNext, ES2025, `erasableSyntaxOnly`)       |
| `node-library.json`  | Published Node packages built with tsup (`Bundler` resolution) |
| `react-library.json` | Published React packages (`jsx: react-jsx` + DOM lib)          |
| `nextjs.json`        | Next.js apps / examples                                        |

Package `tsconfig.json` files should only add `rootDir` / `outDir` / `paths` and any lib extras (e.g. DOM `fetch` types on a Node package).
