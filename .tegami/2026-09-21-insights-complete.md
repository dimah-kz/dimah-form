---
packages:
  group:dimah-form: minor
---

### Insights field stats, crosstab, and capped walks

`@dimah-form/insights` field counts now use **visible** snapshot fields: `n` is the question base, `hidden` is skip-logic, `unanswered` is visible and empty (`isAnswerEmpty`). Categorical `values[].pct` (and score `bands[].pct`) are 0–1; `multiSelect` percentages are of answered respondents. Number fields expose `numeric` (min / max / mean / stdev); date fields expose `dates`. `completion.rate` is `complete / submitted` (or `null`).

`GET /insights/summary` accepts `whereField` + `whereValue`, `bucket=day`, and `maxRows` (cannot raise the plugin cap, default 10_000). The payload includes `scanned` and `truncated`. New `GET /insights/crosstab` (`getFormCrosstab`) folds two categorical fields.

`datasetPlugin({ maxRows })` caps the historical codebook walk; `getDatasetCodebook` includes `truncated`. `@dimah-form/server` exports `resolveLiveForm` and `walkFullResponses` for plugin authors. `@dimah-form/core` exports `isAnswerEmpty` and `resolveFieldTypeRegistry`.
