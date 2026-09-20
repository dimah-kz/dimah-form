---
packages:
  group:dimah-form: minor
---

### Plugin `metaSchema`, `validateAnswers`, and `$Meta`

Plugins merge `metaSchema` / `metaNamespace` and `validateAnswers` in `dimahForm()` the same way they already merge field types and hooks. A namespaced schema validates `meta.scoring` (and similar) only when that key is present, so opt-in plugins do not reject plain forms. `createDefineForm({ plugins })` and `FormDefinitionUi<typeof fieldTypes, typeof plugins>` pick up phantom `$Meta` — use `NamespacedMeta` so plugin keys sit next to UI `meta`. Client plugins may list the same `validateAnswers` and `$Meta`.
