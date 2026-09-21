# @dimah-form/insights

Official insights plugin. Read-side counts from **response definition snapshots** — status totals, visible-required completion, field stats (categorical `%` in document order, including unused `n: 0`; numeric min / max / mean / stdev for any finite number; date range; skip-logic `hidden`), scoring bands, optional day series (`timeZone`, default `UTC`), and a two-field crosstab (`n` is respondents; categorical per snapshot). The live form is order and catalog only. The plugin does not add tables or a `meta` namespace.

This is not a BI warehouse. HTTP walks stored responses (same 100-row pages as list, default cap 10_000). Persist aggregates yourself if N is large.

## Install

```bash
pnpm add @dimah-form/insights
```

Depends on `@dimah-form/scoring`. Peer-depends on `@dimah-form/core`. The server entry also needs `@dimah-form/server`. Browser modules should import from `@dimah-form/insights/client`. Isomorphic code imports `@dimah-form/scoring/document`.

```ts
import { insightsPlugin } from "@dimah-form/insights";
import { insightsClientPlugin } from "@dimah-form/insights/client";

export const form = dimahForm({
  database,
  plugins: [insightsPlugin()],
});
```

Guard `getFormInsights` and `getFormCrosstab` like `listResponses` (admin).

## License

MIT
