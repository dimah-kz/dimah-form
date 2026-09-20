## @dimah-form/ui@0.4.0

### Type-safe form documents for custom field types

- `FormDefinitionFor<typeof fieldTypes>` / `FieldDocumentFor` type built-in field keys and extra `defineFieldType` `fieldSchema` keys. Unregistered `type` strings stay on `defineForm` only.
- `createDefineForm({ fieldTypes })` is a type-only `defineForm` bound to that list. It does not register validators — pass the same array to `dimahForm({ fieldTypes })` and `createFormClient({ fieldTypes })`.
- `FormDefinitionUi<typeof fieldTypes>` (from `@dimah-form/ui/types`) is the same field document plus UI `meta` keys. It does not replace `createDefineForm`. Skip `FormDefinitionUi` when you are not using `@dimah-form/ui`. `defineForm` itself stays a loose runtime parser.
- **Breaking (types):** `satisfies FormDefinitionUi` no longer accepts unregistered custom `type` strings. Pass `FormDefinitionUi<typeof fieldTypes>`. Headless catalogs can type those fields with `createDefineForm({ fieldTypes })` instead.

## @dimah-form/ui@0.3.1

### Improve UI layout, stepper design, and save state placement

- `FormView` puts `FormSaveState` in the header. `FormUiProvider` `components.Header` / `components.SaveState` swap those pieces; `FormHeader` `saveState` follows the same slot rules as other chrome.
- Stepped layouts show `FormStepList` (`ToggleGroup`, named or “Step N of M”) and omit the progress bar and `FormStepHeading` unless `stepList={false}`. `FormProgress` still measures a wizard page when composed inside `FormSteps`.
- Skip a `meta.section` heading when it repeats the current step title. Field groups use `gap-6`.
- `FormStepNav` stays layout-agnostic (no decorative top border). Parent chrome owns the separator, matching `FormActions`.
- Choice options use a pointer cursor; field description / help sit one size down from the label.

## @dimah-form/ui@0.3.0

### Add optional `@dimah-form/ui`

Optional shadcn questionnaire renderer on top of `useFormResponse`. Install from npm or the shadcn registry. Headless `@dimah-form/react` is unchanged.

### Tighten the client fill path

Bound `useFormResponse<"catalogKey">` types answers from `$Infer`. `FormView` locked review renders widgets (`mode="review"`); compact `FormReview` is opt-in. `stepList` follows the same slot rules as other chrome. Built-in `meta.widget` variants (`radio` / `switch` / `chips`) stay on the type widget and are not registry keys.

### Align package seams



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

### Swap the required-field mark from FormUiProvider

Pass `components.RequiredMark` to render your own required indicator on every `FormFieldFrame`. Per-field `requiredIndicator={false}` still hides it.

### Replace hand-rolled fill chrome with shadcn

`@dimah-form/ui` now composes shadcn `Progress`, `InputGroup`, `Item`, `Badge`, `ButtonGroup`, `Empty`, and `ToggleGroup` instead of custom affix, meter, review list, save hint, step jump list, and inactive markup.

`FieldControlAffix` is removed — wrap controls in shadcn `InputGroup` (`InputGroupInput` / `InputGroupAddon` / `InputGroupText`). `FormProgressClassNames` is removed; style `FormProgress` with `className` or `[data-slot=form-progress]`. Compact `FormReview` renders an `Item` list. Default `FormActions` buttons sit in a `ButtonGroup`. `FormInactive` is an `Empty` state.

### Open the UI renderer for composition and per-field widgets

`FormView` `render` and wrap-style slots keep the default chrome while swapping layout. Widgets resolve `meta.widget` before `field.type`. `FormSteps` is keyed from the snapshot (controlled `step` / `onStepChange`) so `showWhen` does not reset the page. `FormUiProvider` `components` and `formatIssue` swap frame/actions/review copy without forking. Built-in widgets honor `mode="review"`. `FormRoot` / `FormActions` use Base UI `render`. Extra `field.meta` keys type-check; `help`, `width: "third"`, and `FormActions` `before` / `after` are supported.

### Add fill chrome, layout primitives, and widget variants

`FormProgress`, `FormSaveState`, and `FormReview` wrap session completion, dirty drafts, and `formatAnswer`. `FormSteps` groups `meta.step`; `FormFields` can filter ids and group `meta.section`. Built-in widgets read `meta.placeholder` and `meta.widget` (`radio`, `switch`, `chips`). Submit focuses the first invalid control.

### Improve fill template, typed UI meta, and session errors

`FormView` infers `layout` (`fill` / `steps` / `review`). Wizard Next validates the current step; Enter advances when `FormSteps` wraps `FormRoot`. Field `meta` is a typed `FieldUiMeta` bag (`width`, `prefix` / `suffix`, …). Type-check a document with `defineForm({ ... } satisfies FormDefinitionUi)` from `@dimah-form/ui`. Step headings live on `form.meta.steps`. Boolean `unsetOnOff` is a field key: off writes `false` unless set, then `null`. Session state exposes `errorCode` and `autosave` so the UI can localize request errors and hide Save draft during autosave.

### Add built-in UI field widgets and composition primitives

`FormView` is a template over `FormScope`, `FormRoot`, `FormFields`, and chrome slots. Built-in types render through a widget registry; custom types register once on `FormUiProvider`.

Field widgets receive `{ binding, className }`. `FormFieldFrame` covers stack / choice / group chrome so custom widgets reuse the same label and issue markup.
