# @dimah-form/react

Thin React client for dimah-form. `createFormClient()` returns the protocol API plus typed hooks. Re-export those from the instance so `$Infer` and field types stay tied to it. Bound hooks do not need `Provider`. No field widgets — you render `visibleFields` / `field(id)`.

```ts
import { createFormClient } from "@dimah-form/react";
import type { Form } from "./form";
import { fieldTypes } from "./field-types";

export const formClient = createFormClient<Form>({ fieldTypes });
export const { useFormClient, useFormResponse } = formClient;
```
