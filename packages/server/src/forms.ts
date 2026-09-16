import {
  formDefinitionSchema,
  type FieldTypeDefinition,
  type FormSnapshot,
} from "@dimah-form/core";
import * as z from "zod";

import { errors } from "./errors";

export function assertFormsConfig(
  forms: Record<string, unknown>,
  fieldTypes: ReadonlyMap<string, FieldTypeDefinition>,
): void {
  for (const [id, form] of Object.entries(forms)) {
    const parsed = formDefinitionSchema.safeParse(form);
    if (!parsed.success) {
      throw new Error(`Invalid form "${id}": ${z.prettifyError(parsed.error)}`);
    }
    for (const field of parsed.data.fields) {
      if (!fieldTypes.has(field.type)) {
        throw new Error(
          `Invalid form "${id}": unknown field type "${field.type}"`,
        );
      }
    }
  }
}

export function resolveLiveForm(
  forms: Record<string, unknown>,
  formId: string,
  fieldTypes: ReadonlyMap<string, FieldTypeDefinition>,
): FormSnapshot {
  if (!Object.hasOwn(forms, formId)) {
    throw errors.unknownForm(formId);
  }
  const parsed = formDefinitionSchema.safeParse(forms[formId]);
  if (!parsed.success) {
    throw errors.validationError(`Invalid form "${formId}"`);
  }
  for (const field of parsed.data.fields) {
    if (!fieldTypes.has(field.type)) {
      throw errors.validationError(`Unknown field type "${field.type}"`);
    }
  }
  return { id: formId, ...parsed.data };
}
