/**
 * Shared copy and helpers for `/llms.txt` and `/llms-full.txt`.
 *
 * Those routes are for coding agents, not the docs UI. This module keeps
 * the positioning blurb, file lists, and URL helpers in one place so the
 * two routes cannot drift. Structure follows https://llmstxt.org (v2):
 * H1, blockquote, preamble (no headings), then H2 file lists.
 */
import {
  docsRoute,
  githubRepoUrl,
  npmPackageUrls,
  xProfileUrl,
} from "./shared";
import { getSiteUrl } from "./site-url";

/** Pages that should appear first in llms-full.txt (then the rest by URL). */
export const LLM_PAGE_PRIORITY = [
  "/docs",
  "/docs/quickstart",
  "/docs/architecture",
  "/docs/snapshots",
  "/docs/forms",
  "/docs/react",
  "/docs/widgets",
  "/docs/ui",
  "/docs/server",
  "/docs/database",
  "/docs/auth",
  "/docs/custom-fields",
  "/docs/plugins",
  "/docs/scoring",
  "/docs/dataset",
  "/docs/configuration",
  "/docs/field-types",
  "/docs/protocol",
  "/docs/errors",
] as const;

export const llmMarkdownHeaders = {
  "Content-Type": "text/markdown; charset=utf-8",
  "Access-Control-Allow-Origin": "*",
} as const;

export function absolutizeMarkdownUrls(markdown: string, origin: string) {
  return markdown.replaceAll("](/", `](${origin}/`);
}

/**
 * Point docs catalog links at markdown twins (`/docs/page.md`), per llmstxt.org.
 * HTML `/docs` URLs still work for humans; agents should fetch `.md`.
 */
export function toMarkdownTwinUrls(markdown: string, origin: string) {
  const docsBase = `${origin}${docsRoute}`;

  return markdown.replaceAll(/\[[^\]]+\]\([^)]+\)/g, (full) => {
    const splitAt = full.indexOf("](");
    const title = full.slice(1, splitAt);
    const url = full.slice(splitAt + 2, -1);
    if (!url.startsWith(docsBase)) return full;
    if (/\.(?:md|mdx|txt)$/i.test(url)) return full;
    return `[${title}](${url}.md)`;
  });
}

export function llmDecisionSheet(): string {
  return `# dimah-form

> Backend-first questionnaire engine: the library owns the protocol, definition snapshots, and submit validation. You own UI, auth, and the database adapter. Not a form renderer, and not a hosted survey product.

TypeScript packages: \`@dimah-form/server\` (\`dimahForm()\` handler and \`api\`), \`@dimah-form/react\` (thin client and \`useFormResponse\`). Optional \`@dimah-form/ui\` is a shadcn renderer on top of the headless session. Optional \`@dimah-form/db\` is the FumaDB SQL adapter. Optional \`@dimah-form/scoring\` is the scoring plugin (Likert and option keying). Optional \`@dimah-form/dataset\` is the dataset plugin (JSONL + codebook interchange). Protocol types live in \`@dimah-form/core\`.

HTTP adapters: Next.js App Router, Express, Hono, Fastify, Elysia, SvelteKit, and Node. Persistence is required: \`memoryAdapter()\` from \`@dimah-form/server\` (Quickstart), or optional \`db()\` from \`@dimah-form/db\` for SQL. Built-in field types: text, number, boolean, select, multiSelect, email, date. Extra types are \`defineFieldType\` validators, not components.

Use it when the app needs typed questionnaires with drafts, snapshots, and submit validation, while keeping widgets in the consumer app or the optional UI package. Skip it when you want a visual form builder or hosted survey SaaS.

Install: \`pnpm add @dimah-form/server @dimah-form/react\`. Add \`@dimah-form/db\` only for production SQL.

- Auth stays in consumer \`guard\` hooks. Do not look for library auth.
- Persistence is \`database\`, not a plugin. Plugins add endpoints, hooks, field types, error codes, \`metaSchema\`, \`validateAnswers\`, and \`validateDefinition\`. Official Likert scoring is \`@dimah-form/scoring\` (\`meta.scoring\` on the snapshot; do not store scores in \`answers\`). Official dataset interchange is \`@dimah-form/dataset\` (JSONL + codebook from the response snapshot; no tables).
- Apps import from the package they already use: \`@dimah-form/server\` on the server, \`@dimah-form/react\` in the browser. Share \`$Infer\` with \`export type Form = typeof form\` and \`createFormClient<Form>()\`.
- Filling a response is headless: \`useFormResponse\` / \`createFormResponseSession\`. Optional \`@dimah-form/ui\` wraps that session. Consumers may still own widgets.
- Each response stores the definition it was started with. Submit validates that snapshot.
`;
}

export function llmFileLists(origin = getSiteUrl().origin): string {
  return `## Packages

- [@dimah-form/server](${npmPackageUrls[0]}): \`dimahForm()\` — HTTP handler, typed api, adapters
- [@dimah-form/react](${npmPackageUrls[1]}): thin React client (\`createFormClient\` / \`useFormResponse\`)
- [@dimah-form/core](${npmPackageUrls[2]}): protocol SSOT, field types, fetch client
- [@dimah-form/db](${npmPackageUrls[3]}): optional FumaDB adapter for production SQL
- [@dimah-form/ui](${npmPackageUrls[4]}): optional shadcn renderer (npm or registry)
- [@dimah-form/scoring](${npmPackageUrls[5]}): optional scoring plugin (Likert and option keying)
- [@dimah-form/dataset](${npmPackageUrls[6]}): optional dataset plugin (JSONL + codebook interchange)

## Optional

- [Full docs dump](${origin}/llms-full.txt): every page as markdown
- [GitHub](${githubRepoUrl()}): source and the example app
- [X](${xProfileUrl}): updates
`;
}
