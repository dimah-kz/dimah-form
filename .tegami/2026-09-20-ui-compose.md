---
packages:
  group:dimah-form: minor
---

### Open the UI renderer for composition and per-field widgets

`FormView` `render` and wrap-style slots keep the default chrome while swapping layout. Widgets resolve `meta.widget` before `field.type`. `FormSteps` is keyed from the snapshot (controlled `step` / `onStepChange`) so `showWhen` does not reset the page. `FormUiProvider` `components` and `formatIssue` swap frame/actions/review copy without forking. Built-in widgets honor `mode="review"`. `FormRoot` / `FormActions` use Base UI `render`. Extra `field.meta` keys type-check; `help`, `width: "third"`, and `FormActions` `before` / `after` are supported.
