# @dimah-form/react

Thin React client for dimah-form. `createFormClient()` returns the protocol API plus a `Provider` and `useFormResponse`. Re-export those from the instance so `$Infer` and field types stay tied to it. No field widgets — you render `visibleFields` / `field(id)`.

```ts
import { createFormClient } from "@dimah-form/react";
import type { Form } from "./form";
import { fieldTypes } from "./field-types";

export const formClient = createFormClient<Form>({ fieldTypes });
export const { Provider, useFormClient, useFormResponse } = formClient;
```
