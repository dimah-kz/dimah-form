---
packages:
  group:dimah-form: minor
---

### Swap the required-field mark from FormUiProvider

Pass `components.RequiredMark` to render your own required indicator on every `FormFieldFrame`. Per-field `requiredIndicator={false}` still hides it.
