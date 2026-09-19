---
packages:
  group:dimah-form: minor
---

### Add built-in UI field widgets and composition primitives

`FormView` is a template over `FormScope`, `FormRoot`, `FormFields`, and chrome slots. Built-in types render through a widget registry; custom types register once on `FormUiProvider`.

Field widgets receive `{ binding, className }`. `FormFieldFrame` covers stack / choice / group chrome so custom widgets reuse the same label and issue markup.
