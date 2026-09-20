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
    <FormUiProvider widgets={widgets}>
      <FormView form={form} />
    </FormUiProvider>
  );
}
```

A widget is `{ binding, className, mode? }`. Wrap the control in `FormFieldFrame`
(`layout`: `stack` | `choice` | `group`) so `components.FieldFrame` applies. Register custom `defineFieldType`
widgets once on `FormUiProvider` (or per `FormView` / `FormScope`) — same `type`
string, or a `meta.widget` key (`radio` / `switch` / `chips` are built-in
variants, not registry keys). Swap chrome with `components` (`RequiredMark`,
`FieldFrame`, …) and localize extra issue codes with `formatIssue`. Built-in
types (`text`, `email`, `date`, `number`, `boolean`, `select`, `multiSelect`)
ship with the package. `FormView layout="auto"` picks a wizard when `meta.step`
groups, and widgets in `mode="review"` when locked (`FormReview` is a compact
`Item` list). Prefix / suffix use shadcn `InputGroup`. `render` / wrap-style
slots keep the template while you own layout. Presentation lives on `meta`
(`widget`, `placeholder`, `section`, `step`, `width`, `help`, …) —
`defineForm({ ... } satisfies FormDefinitionUi)` so those keys autocomplete;
pass `FormDefinitionUi<typeof fieldTypes>` (or `createDefineForm`) for custom
field keys. Extra keys stay allowed. Import `FormDefinitionUi` from
`@dimah-form/ui/types` in server form catalogs. Compose `FormScope` + primitives
when you want every piece by hand.

## License

MIT
