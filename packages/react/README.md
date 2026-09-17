# @dimah-form/react

Thin React client for dimah-form. `createFormClient()` returns the protocol API plus bound hooks. Re-export those from the instance so the protocol client, `$Infer`, and field types stay tied to it. Bound hooks do not need `Provider`. Fill-session `answers` are `FormAnswers`; the typed catalog is `client.$Infer`. Define shared field types from `@dimah-form/core` (this package is `"use client"`). No field widgets — you render `visibleFields` / `field(id)`.

```ts
import { createFormClient } from "@dimah-form/react";
import type { Form } from "./form";
import { fieldTypes } from "./field-types";

export const formClient = createFormClient<Form>({ fieldTypes });
export const { useFormClient, useFormResponse } = formClient;
```
