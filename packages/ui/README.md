# @dimah-form/ui

Optional prebuilt UI for `dimah-form`, on top of `@dimah-form/react` and
[shadcn/ui](https://ui.shadcn.com).

The fill session stays headless. This package wraps `FormResponseApi` /
`FormFieldBinding` — it does not call `useFormResponse`.

Full documentation: [form.dimah.dev/docs/ui](https://form.dimah.dev/docs/ui) ·
[llms.txt](https://form.dimah.dev/llms.txt)

## Install

```bash
pnpm add @dimah-form/ui @dimah-form/react
```

Or copy items from the shadcn registry — see
[UI Setup](https://form.dimah.dev/docs/ui).

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
import { createFormClient } from "@dimah-form/react";
import { FormUiProvider, FormView } from "@dimah-form/ui";

export const formClient = createFormClient();
export const { useFormResponse } = formClient;

const widgets = { rating: StarRatingField };

export function IntakeForm({ snapshot }) {
  const form = useFormResponse({ snapshot });

  return (
    <formClient.Provider>
      <FormUiProvider widgets={widgets}>
        <FormView form={form} />
      </FormUiProvider>
    </formClient.Provider>
  );
}
```

A widget is `{ binding, className }`. Wrap the control in `FormFieldFrame`
(`layout`: `stack` | `choice` | `group`). Register custom `defineFieldType`
widgets once on `FormUiProvider` (or per `FormView` / `FormScope`). Built-in
types (`text`, `email`, `date`, `number`, `boolean`, `select`, `multiSelect`)
ship with the package. Compose `FormScope` + `FormFields` / `TextField` /
`FormActions` when the default template is not enough.

## License

MIT
