# @dimah-form/insights

Official insights plugin. Read-side counts from **response definition snapshots** — status totals, visible-required completion, categorical value counts, and optional scoring bands. The plugin does not add tables or a `meta` namespace.

This is not a BI warehouse. HTTP walks stored responses (same 100-row pages as list). Persist aggregates yourself if N is large.

## Install

```bash
pnpm add @dimah-form/insights
```

Peer-depends on `@dimah-form/core`. The server entry also needs `@dimah-form/server`. Score bands need `@dimah-form/scoring` (optional peer). Browser modules should import from `@dimah-form/insights/client`.

```ts
import { insightsPlugin } from "@dimah-form/insights";
import { insightsClientPlugin } from "@dimah-form/insights/client";

export const form = dimahForm({
  database,
  plugins: [insightsPlugin()],
});
```

Guard `getFormInsights` like `listResponses` (admin).

## License

MIT
