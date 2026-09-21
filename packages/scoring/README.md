# @dimah-form/scoring

Official scoring plugin. Named variables accumulate points from selected options (and mapped number / boolean fields). Likert items map a field to one variable; keying items list `{ variable, points }` on each option. Scores are computed from the **response definition snapshot** and stored answers — never the live questionnaire.

Not a field type. Scores are not stored in `answers`. Persistence is compute-on-read plus an optional `onScore` callback for your own database. The plugin does not add tables.

## Install

```bash
pnpm add @dimah-form/scoring
```

Peer-depends on `@dimah-form/core`. The server entry also needs `@dimah-form/server`. Browser modules should import from `@dimah-form/scoring/client` so the server package stays off the client bundle. Other packages import the document readers from `@dimah-form/scoring/document` (`readScoringFormMeta`, `tryScoreResponse`) — that entry does not load the server plugin.

```ts
import { scoringPlugin } from "@dimah-form/scoring";
import { scoringClientPlugin, scoreResponse } from "@dimah-form/scoring/client";

export const form = dimahForm({
  database,
  plugins: [
    scoringPlugin({
      onScore: ({ response, scores }) => {
        /* your table */
      },
    }),
  ],
});

const clientPlugins = [scoringClientPlugin()] as const;
export const formClient = createFormClient<Form, typeof clientPlugins>({
  plugins: clientPlugins,
});

const live = scoreResponse(session.snapshot, session.answers);
const stored = await formClient.getResponseScores({ responseId });
```

Author with `createDefineForm({ plugins })` so `meta.scoring` autocompletes. Guard operation for `GET /scoring/response` is `getResponseScores`.

## Document

Form:

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

Field (select / multiSelect / number / boolean) — Likert:

```ts
meta: { scoring: { variable: "gad7", reverse?: true } }
```

Option — Likert points, or keying `add` (not both; keying omits `field.variable`):

```ts
meta: {
  scoring: {
    points: 0;
  }
}

meta: {
  scoring: {
    add: [
      { variable: "extraversion", points: 2 },
      { variable: "openness", points: 1 },
    ];
  }
}
```

Use built-in `select` plus `meta.widget: "radio"` for Likert items. Do not add a `likert` field type.

Every `variables[].id` must appear on a field (`meta.scoring.variable`) or an option (`meta.scoring.add`). Unmapped ids fail `validateDefinition`.

Optional typed sums (not a formula language). `vars` must be unique variable ids, not other formulas:

```ts
formulas: [{ id: "total", op: "sum", vars: ["subscaleA", "subscaleB"] }];
```

## Missing items

`variables[].missing` is `"incomplete"` (default), `"zero"`, or `"omit"`.

| Policy                 | Unanswered visible items                                    |
| ---------------------- | ----------------------------------------------------------- |
| `incomplete` (default) | `raw` is `null`, `complete` is false                        |
| `zero`                 | count as 0 (running Likert total)                           |
| `omit`                 | drop from the sum; `raw` is `null` only when nothing scored |

Hidden `showWhen` fields do not contribute and do not count as missing. If **every** contributing item for a variable is hidden, `incomplete` (and `omit`) yield `raw: null`; `zero` stays `0`. Prefer `incomplete` for clinical totals; set `zero` when a running quiz total is the product.

## Reverse scoring

`reversed = min + max - points`.

- **select** — min/max are that field's option `meta.scoring.points` (so a 0–3 item on a 0–21 scale reverses as `3 - points`, not `21 - points`). `option.add` is not reversed.
- **number** — min is `field.min ?? 0`; `field.max` is required when `reverse` is true (not the variable's scale range).
- **boolean** — `1 - value`.
- **multiSelect** — not supported.

## Output

```ts
{
  complete: boolean,
  variables: {
    gad7: {
      raw: number | null,
      min?: number,
      max?: number,
      missing: number,
      band?: string,
      complete: boolean,
      label?: string,
    },
  },
}
```

Bands are interpretation, not scoring. The first matching band in document order wins (`from` / `to` are inclusive; omit either for an open end).

## License

MIT
