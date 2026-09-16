# @dimah-form/react

Thin React client for dimah-form. `createFormClient()` returns the protocol API plus a `Provider`. Re-export `useFormClient` from that instance so `$Infer` stays typed. No field widgets — you render answers.

```ts
import { createFormClient } from "@dimah-form/react";
import type { Form } from "./form";

export const formClient = createFormClient<Form>();
export const { Provider, useFormClient } = formClient;
```

`isFieldVisible`, `seedDefaultAnswers`, `collectAnswerIssues`, and `applyAnswerPatch` are re-exported for consumer UI.
