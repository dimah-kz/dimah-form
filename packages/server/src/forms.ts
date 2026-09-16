import {
  formDefinitionSchema,
  formSnapshotSchema,
  type FieldTypeDefinition,
  type FormSnapshot,
} from "@dimah-form/core";
import * as z from "zod";

import { errors } from "./errors";
import type { ResolvedDimahFormConfig } from "./types";

function assertRegisteredTypes(
  formId: string,
  fields: readonly { type: string }[],
  fieldTypes: ReadonlyMap<string, FieldTypeDefinition>,
  asError: "init" | "request",
): void {
  for (const field of fields) {
    if (fieldTypes.has(field.type)) continue;
    const message = `Unknown field type "${field.type}"`;
    if (asError === "init") {
      throw new Error(`Invalid form "${formId}": ${message}`);
    }
    throw errors.validationError(message);
  }
}

export function assertFormsConfig(
  forms: Record<string, unknown>,
  fieldTypes: ReadonlyMap<string, FieldTypeDefinition>,
): void {
  for (const [id, form] of Object.entries(forms)) {
    const parsed = formDefinitionSchema.safeParse(form);
    if (!parsed.success) {
      throw new Error(`Invalid form "${id}": ${z.prettifyError(parsed.error)}`);
    }
    assertRegisteredTypes(id, parsed.data.fields, fieldTypes, "init");
  }
}

export function snapshotFromConfig(
  forms: Record<string, unknown>,
  formId: string,
  fieldTypes: ReadonlyMap<string, FieldTypeDefinition>,
): FormSnapshot {
  const parsed = formDefinitionSchema.safeParse(forms[formId]);
  if (!parsed.success) {
    throw errors.validationError(`Invalid form "${formId}"`);
  }
  assertRegisteredTypes(formId, parsed.data.fields, fieldTypes, "request");
  return { id: formId, ...parsed.data };
}

export function parseLiveSnapshot(
  form: unknown,
  fieldTypes: ReadonlyMap<string, FieldTypeDefinition>,
): FormSnapshot {
  const parsed = formSnapshotSchema.safeParse(form);
  if (!parsed.success) {
    throw errors.validationError("Invalid form");
  }
  assertRegisteredTypes(
    parsed.data.id,
    parsed.data.fields,
    fieldTypes,
    "request",
  );
  return parsed.data;
}

export async function resolveLiveForm(
  config: ResolvedDimahFormConfig,
  formId: string,
): Promise<FormSnapshot> {
  if (Object.hasOwn(config.forms, formId)) {
    return snapshotFromConfig(config.forms, formId, config.fieldTypes);
  }
  const stored = await config.database.getForm(formId);
  if (!stored) {
    throw errors.unknownForm(formId);
  }
  return parseLiveSnapshot(stored, config.fieldTypes);
}

export async function listLiveForms(
  config: ResolvedDimahFormConfig,
): Promise<FormSnapshot[]> {
  const fromConfig = Object.keys(config.forms).map((formId) =>
    snapshotFromConfig(config.forms, formId, config.fieldTypes),
  );
  const seen = new Set(fromConfig.map((form) => form.id));
  const fromDatabase = await config.database.listForms();
  const extra: FormSnapshot[] = [];
  for (const form of fromDatabase) {
    if (seen.has(form.id)) continue;
    extra.push(parseLiveSnapshot(form, config.fieldTypes));
  }
  return [...fromConfig, ...extra];
}
