# @dimah-form/ui

Optional prebuilt UI for `dimah-form`, on top of `@dimah-form/react` and
[shadcn/ui](https://ui.shadcn.com).

The fill session stays headless. This package wraps `FormResponseApi` /
`FormFieldBinding` — it does not call `useFormResponse`.

**Documentation:** [UI](https://form.dimah.dev/docs/ui) ·
[Custom rendering](https://form.dimah.dev/docs/widgets) ·
[llms.txt](https://form.dimah.dev/llms.txt)

## Install

```bash
pnpm add @dimah-form/ui @dimah-form/react
```

Or copy the source through the shadcn registry:

```bash
pnpm dlx shadcn@latest add https://form.dimah.dev/r/form.json
```

## Styles

Import once in your CSS (Tailwind v4 source scan + shadcn color bridge):

```css
@import "@dimah-form/ui/styles.css";
```

Colors default to your shadcn theme (`--primary`, `--muted`, …). Override
`--color-dimah-form-*` to theme the library alone.

## Quick start

```tsx
import { FormUiProvider, FormView } from "@dimah-form/ui";
import { useFormResponse } from "./form-client";

export function IntakeForm({ snapshot }) {
  const form = useFormResponse({ snapshot });

  return (
    <FormUiProvider>
      <FormView form={form} />
    </FormUiProvider>
  );
}
```

Built-in widgets cover `text`, `email`, `date`, `number`, `boolean`, `select`,
and `multiSelect`; file upload remains application-owned. `layout="auto"` uses
steps when fields have `meta.step` and review mode when the response is locked.

Customize through:

- `widgets` for custom field types or `meta.widget` variants
- `components` for field and action chrome
- slots or `render` for layout
- `formatIssue`, `formatSessionError`, and `translations` for localized copy
- `FormScope` plus primitives for fully composed interfaces

Import `FormDefinitionUi` from `@dimah-form/ui/types` in server-side form
catalogs so UI metadata is typed without loading the UI runtime.

## License

MIT
