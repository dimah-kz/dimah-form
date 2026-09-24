# @dimah-form/insights

Official compute-on-read summaries for dimah-form: status totals,
visibility-correct completion, field statistics, scoring bands, day series, and
two-field crosstabs. Results are folded from response definition snapshots;
the plugin adds no tables or metadata namespace.

This is not a BI warehouse. Persist aggregates in your own database when the
response set is large.

**Documentation:** [Insights](https://form.dimah.dev/docs/plugins/insights)

## Install

```bash
pnpm add @dimah-form/insights
```

```ts
import { insightsPlugin } from "@dimah-form/insights";

export const form = dimahForm({
  database,
  plugins: [insightsPlugin()],
});
```

```ts
import { insightsClientPlugin } from "@dimah-form/insights/client";

const plugins = [insightsClientPlugin()] as const;
export const formClient = createFormClient<Form, typeof plugins>({ plugins });
```

Guard `getFormInsights` and `getFormCrosstab` like administrative
`listResponses` access. There is no default status filter. Walks default to a
10,000-row cap; query `maxRows` may lower it, and results expose `truncated`.

## License

MIT
