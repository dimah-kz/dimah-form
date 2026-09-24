# @dimah-form/react

Typed React client and headless fill-session hooks for dimah-form. It manages
visibility, local answers, drafts, autosave, validation, and submit; it does
not ship input widgets.

**Documentation:** [Client session](https://form.dimah.dev/docs/react) ·
[Custom rendering](https://form.dimah.dev/docs/widgets) ·
[Optional UI](https://form.dimah.dev/docs/ui)

## Install

```bash
pnpm add @dimah-form/react
```

```ts
import { createFormClient } from "@dimah-form/react";
import type { Form } from "./form";
import { fieldTypes } from "./field-types";

export const formClient = createFormClient<Form>({
  basePath: "/api/form",
  fieldTypes,
});
export const { useFormClient, useFormResponse } = formClient;
```

Re-export the bound hooks so `$Infer`, plugin methods, and runtime field types
stay tied to the same instance. Bound hooks do not need `Provider`.

```tsx
const form = useFormResponse<"onboarding">({ snapshot });

return form.visibleFields.map((field) => {
  const binding = form.field(field.id);
  return <MyField key={field.id} binding={binding} />;
});
```

Define shared custom field types in an isomorphic module using
`@dimah-form/core`, then pass the same array to the server and client. For a
prebuilt renderer, add `@dimah-form/ui`.

## License

MIT
