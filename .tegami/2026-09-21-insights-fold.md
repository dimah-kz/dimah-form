---
packages:
  group:dimah-form: major
---

### Insights catalog order

`@dimah-form/insights` categorical `values` and score `bands` follow the document catalog, including unused levels at `n: 0`, in document order rather than by frequency. `fields` follow the live questionnaire; ids that exist only on older snapshots come after. The live form does not invent fields that never appear in the scanned rows.

`numeric` is any finite number answer, including custom field types, not only `type: "number"`. `whereValue` matches a finite number when it equals `String(value)` (`"5"` matches `5`).

`GET /insights/crosstab` adds `n` (respondents who contributed a cell, not multiSelect tokens). Axis totals use the same catalog, with unused `n: 0`. An axis that is on the live form and not categorical is still `VALIDATION_ERROR`. An id missing from the live form still folds from snapshots.
