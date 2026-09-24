# @dimah-form/scoring

Official scoring plugin for dimah-form. It derives named variables, bands, and
sum formulas from the response definition snapshot and stored answers—never
from the live questionnaire.

Scoring is not a field type, does not write into `answers`, and adds no tables.

**Documentation:** [Scoring](https://form.dimah.dev/docs/plugins/scoring)

## Install

```bash
pnpm add @dimah-form/scoring
```

```ts
import { scoringPlugin } from "@dimah-form/scoring";

export const form = dimahForm({
  database,
  plugins: [scoringPlugin()],
});
```

```ts
import { scoreResponse, scoringClientPlugin } from "@dimah-form/scoring/client";

const plugins = [scoringClientPlugin()] as const;
export const formClient = createFormClient<Form, typeof plugins>({
  plugins,
});

const live = scoreResponse(session.snapshot, session.answers);
const stored = await formClient.getResponseScores({ responseId });
```

Use the root entry on the server, `/client` in browser bundles, and `/document`
for isomorphic document readers without the server plugin. Author with
`createDefineForm({ plugins })` so `meta.scoring` autocompletes.

```ts
meta: {
  scoring: {
    variables: [{ id: "gad7", label: "GAD-7", min: 0, max: 21 }],
    bands: [
      { variable: "gad7", from: 0, to: 4, label: "Minimal" },
      { variable: "gad7", from: 5, to: 9, label: "Mild" },
    ],
  },
}
```

Map `select`, `multiSelect`, `number`, or `boolean` fields to variables.
Options either contribute `points` to the field variable or use `add` for
keying; do not mix the two. Missing policies are `"incomplete"` (default),
`"zero"`, or `"omit"`. Hidden fields never contribute or count as missing.

`reverse` supports select, number, and boolean fields. Formulas are typed sums
of distinct variables, not an expression language. Bands are inclusive labels;
the first matching band wins.

`onScore` runs after submit persistence and may project results to an
application-owned table. Make it idempotent and do not mutate response answers.
The guarded HTTP operation is `GET /scoring/response`
(`getResponseScores`).

## License

MIT
