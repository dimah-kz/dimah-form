---
packages:
  group:dimah-form: major
---

### Replace hand-rolled fill chrome with shadcn

`@dimah-form/ui` now composes shadcn `Progress`, `InputGroup`, `Item`, `Badge`, `ButtonGroup`, `Empty`, and `ToggleGroup` instead of custom affix, meter, review list, save hint, step jump list, and inactive markup.

`FieldControlAffix` is removed — wrap controls in shadcn `InputGroup` (`InputGroupInput` / `InputGroupAddon` / `InputGroupText`). `FormProgressClassNames` is removed; style `FormProgress` with `className` or `[data-slot=form-progress]`. Compact `FormReview` renders an `Item` list. Default `FormActions` buttons sit in a `ButtonGroup`. `FormInactive` is an `Empty` state.
