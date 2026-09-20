---
packages:
  group:dimah-form: minor
---

### Type-safe form documents for custom field types

- `FormDefinitionFor<typeof fieldTypes>` / `FieldDocumentFor` type built-in field keys and extra `defineFieldType` `fieldSchema` keys. Unregistered `type` strings stay on `defineForm` only.
- `createDefineForm({ fieldTypes })` is a type-only `defineForm` bound to that list. It does not register validators — pass the same array to `dimahForm({ fieldTypes })` and `createFormClient({ fieldTypes })`.
- `FormDefinitionUi<typeof fieldTypes>` (from `@dimah-form/ui/types`) is the same field document plus UI `meta` keys. It does not replace `createDefineForm`. Skip `FormDefinitionUi` when you are not using `@dimah-form/ui`. `defineForm` itself stays a loose runtime parser.
- **Breaking (types):** `satisfies FormDefinitionUi` no longer accepts unregistered custom `type` strings. Pass `FormDefinitionUi<typeof fieldTypes>`. Headless catalogs can type those fields with `createDefineForm({ fieldTypes })` instead.
