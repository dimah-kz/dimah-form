---
packages:
  group:dimah-form: patch
---

### Improve UI layout, stepper design, and save state placement

- `FormView` puts `FormSaveState` in the header. `FormUiProvider` `components.Header` / `components.SaveState` swap those pieces; `FormHeader` `saveState` follows the same slot rules as other chrome.
- Stepped layouts show `FormStepList` (`ToggleGroup`, named or “Step N of M”) and omit the progress bar and `FormStepHeading` unless `stepList={false}`. `FormProgress` still measures a wizard page when composed inside `FormSteps`.
- Skip a `meta.section` heading when it repeats the current step title. Field groups use `gap-6`.
- `FormStepNav` stays layout-agnostic (no decorative top border). Parent chrome owns the separator, matching `FormActions`.
- Choice options use a pointer cursor; field description / help sit one size down from the label.
