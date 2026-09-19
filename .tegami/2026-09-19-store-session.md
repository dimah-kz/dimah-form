---
packages:
  group:dimah-form: major
---

### Store CAS, atomic resume, compound showWhen

`ResponseStore.save` / `saveForm` take `{ expectedUpdatedAt }` and throw `StoreConflictError` (`STALE_UPDATE`). Resume uses `findLatestDraft` / `getOrCreateDraft` instead of list-then-create. `listResponses({ include: "summary" })` skips snapshot JSON at the adapter. `guard` receives `getResponse` / `getForm` (store reads, no HTTP re-entry).

`showWhen` supports `all` / `any` / `notEquals`. Date fields accept `min` / `max`. `parseAnswers`, `assertAnswers`, `collectAnswerIssues`, field `validate`, and `validateAnswers` may be async. Fill session state includes `issueParams` and `completion`; `validate()` is async; `autosave` debounces `saveDraft`; local edits during an in-flight save are kept.
