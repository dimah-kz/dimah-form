---
packages:
  group:dimah-form: minor
---

# Align package seams

### Shared app protocol on server and react

Apps import protocol helpers from `@dimah-form/server` or `@dimah-form/react`. Both re-export `@dimah-form/core/app-protocol`. `@dimah-form/core` stays for plugin authors and shared `defineFieldType` modules.

### Field types: `format` and client plugin registries

`defineFieldType` accepts optional `format` (English display string). `formatAnswer` / review use it when `fieldTypes` are passed. `defineClientPlugin` accepts `fieldTypes` and merges them the same way server plugins do. `$Infer` from `createFormClient<Form>()` is still type-only — pass `fieldTypes` or a client plugin for local validation.

### `ResponseStore` response methods

`create` / `get` / `save` / `delete` are now `createResponse` / `getResponse` / `saveResponse` / `deleteResponse`. Questionnaire methods stay `*Form`. `findLatestDraft` is newest-by-`updatedAt`; `getOrCreateDraft` keeps the oldest-by-`createdAt` race winner.

### Plugin author surface

`errors` is exported from `@dimah-form/server`. Plugin `init` receives `basePath`, `fieldTypes`, sibling `plugins`, and `getPluginContext` — not the internal resolved config.

### UI types entry

`import type { FormDefinitionUi } from "@dimah-form/ui/types"` in server form catalogs. `fieldsUseHalfWidth` is removed (`fieldsUseGrid`). `@dimah-form/db` peers on `@dimah-form/server` with `workspace:^`.
