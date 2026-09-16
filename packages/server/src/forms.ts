import { formDefinitionSchema, type FormSnapshot } from "@dimah-form/core";
import * as z from "zod";

import { errors } from "./errors";

export function assertFormsConfig(forms: Record<string, unknown>): void {
  for (const [id, form] of Object.entries(forms)) {
    const parsed = formDefinitionSchema.safeParse(form);
    if (!parsed.success) {
      throw new Error(`Invalid form "${id}": ${z.prettifyError(parsed.error)}`);
    }
  }
}

export function resolveLiveForm(
  forms: Record<string, unknown>,
  formId: string,
): FormSnapshot {
  if (!Object.hasOwn(forms, formId)) {
    throw errors.unknownForm(formId);
  }
  const parsed = formDefinitionSchema.safeParse(forms[formId]);
  if (!parsed.success) {
    throw errors.validationError(`Invalid form "${formId}"`);
  }
  return { id: formId, ...parsed.data };
}
