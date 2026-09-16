import {
  formDefinitionSchema,
  normalizeFormSnapshot,
  safeParseFormSnapshot,
  type FieldTypeDefinition,
  type FormSnapshot,
  type FormStatus,
} from "@dimah-form/core";
import * as z from "zod";

import { errors } from "./errors";
import type { ResolvedDimahFormConfig } from "./types";

function fail(
  asError: "init" | "request",
  formId: string,
  message: string,
): never {
  if (asError === "init") {
    throw new Error(`Invalid form "${formId}": ${message}`);
  }
  throw errors.validationError(message);
}

function assertFieldDocuments(
  formId: string,
  fields: readonly Record<string, unknown>[],
  fieldTypes: ReadonlyMap<string, FieldTypeDefinition>,
  asError: "init" | "request",
): void {
  for (const field of fields) {
    const type = typeof field.type === "string" ? field.type : "";
    const fieldType = fieldTypes.get(type);
    if (!fieldType) {
      if (asError === "init") {
        throw new Error(
          `Invalid form "${formId}": Unknown field type "${type}"`,
        );
      }
      throw errors.unknownFieldType(type);
    }
    if (!fieldType.fieldSchema) continue;
    const parsed = fieldType.fieldSchema.safeParse(field);
    if (!parsed.success) {
      fail(
        asError,
        formId,
        parsed.error.issues[0]?.message ?? `Invalid "${type}" field`,
      );
    }
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
    assertFieldDocuments(id, parsed.data.fields, fieldTypes, "init");
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
  assertFieldDocuments(formId, parsed.data.fields, fieldTypes, "request");
  return normalizeFormSnapshot({ id: formId, ...parsed.data });
}

export function parseLiveSnapshot(
  form: unknown,
  fieldTypes: ReadonlyMap<string, FieldTypeDefinition>,
): FormSnapshot {
  const parsed = safeParseFormSnapshot(form);
  if (!parsed.success) {
    throw errors.validationError("Invalid form");
  }
  assertFieldDocuments(
    parsed.data.id,
    parsed.data.fields,
    fieldTypes,
    "request",
  );
  return parsed.data;
}

export async function resolveLiveForm(
  config: ResolvedDimahFormConfig,
  idOrSlug: string,
): Promise<FormSnapshot> {
  if (Object.hasOwn(config.forms, idOrSlug)) {
    return snapshotFromConfig(config.forms, idOrSlug, config.fieldTypes);
  }
  for (const formId of Object.keys(config.forms)) {
    const snapshot = snapshotFromConfig(
      config.forms,
      formId,
      config.fieldTypes,
    );
    if (snapshot.slug === idOrSlug) return snapshot;
  }
  const stored = await config.database.getForm(idOrSlug);
  if (!stored) {
    throw errors.unknownForm(idOrSlug);
  }
  return parseLiveSnapshot(stored, config.fieldTypes);
}

export function requireActiveForm(form: FormSnapshot): void {
  if (form.status !== "active") {
    throw errors.formInactive(form.id);
  }
}

export async function listLiveForms(
  config: ResolvedDimahFormConfig,
  query: { status?: FormStatus } = {},
): Promise<FormSnapshot[]> {
  const fromConfig = Object.keys(config.forms)
    .map((formId) =>
      snapshotFromConfig(config.forms, formId, config.fieldTypes),
    )
    .filter((form) => !query.status || form.status === query.status);
  const seen = new Set(fromConfig.map((form) => form.id));
  const fromDatabase = await config.database.listForms({
    status: query.status,
  });
  const extra: FormSnapshot[] = [];
  for (const form of fromDatabase) {
    if (seen.has(form.id)) continue;
    try {
      extra.push(parseLiveSnapshot(form, config.fieldTypes));
    } catch {
      continue;
    }
  }
  return [...fromConfig, ...extra].sort((a, b) =>
    (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""),
  );
}

export async function assertSlugAvailable(
  config: ResolvedDimahFormConfig,
  form: FormSnapshot,
): Promise<void> {
  for (const formId of Object.keys(config.forms)) {
    const snapshot = snapshotFromConfig(
      config.forms,
      formId,
      config.fieldTypes,
    );
    if (snapshot.id === form.id) continue;
    if (snapshot.id === form.slug || snapshot.slug === form.slug) {
      throw errors.slugTaken(form.slug);
    }
  }
  const existing = await config.database.getForm(form.slug);
  if (existing && existing.id !== form.id) {
    throw errors.slugTaken(form.slug);
  }
}
