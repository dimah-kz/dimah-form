---
packages:
  group:dimah-form: minor
---

### Add fill chrome, layout primitives, and widget variants

`FormProgress`, `FormSaveState`, and `FormReview` wrap session completion, dirty drafts, and `formatAnswer`. `FormSteps` groups `meta.step`; `FormFields` can filter ids and group `meta.section`. Built-in widgets read `meta.placeholder` and `meta.widget` (`radio`, `switch`, `chips`). Submit focuses the first invalid control.
