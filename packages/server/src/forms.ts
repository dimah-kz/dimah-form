import {
  collectShowWhenIssues,
  formDefinitionSchema,
  isFormErrorCode,
  metaSchemaTarget,
  normalizeFormSnapshot,
  safeParseFormSnapshot,
  type AppliedMetaSchema,
  type FieldTypeDefinition,
  type FormField,
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

function assertMeta(
  schema: z.ZodType | undefined,
  value: unknown,
  asError: "init" | "request",
  formId: string,
  label: string,
): void {
  if (!schema) return;
  const parsed = schema.safeParse(value);
  if (parsed.success) return;
  fail(asError, formId, parsed.error.issues[0]?.message ?? `Invalid ${label}`);
}

function assertDocumentMeta(
  formId: string,
  form: { meta?: unknown; fields: readonly Record<string, unknown>[] },
  metaSchemas: readonly AppliedMetaSchema[],
  asError: "init" | "request",
): void {
  if (metaSchemas.length === 0) return;
  for (const bag of metaSchemas) {
    const formTarget = metaSchemaTarget(form.meta, bag.namespace);
    if (formTarget.present) {
      assertMeta(bag.form, formTarget.value, asError, formId, "form meta");
    }
    if (!bag.field && !bag.option) continue;
    for (const field of form.fields) {
      const fieldTarget = metaSchemaTarget(field.meta, bag.namespace);
      if (fieldTarget.present) {
        assertMeta(bag.field, fieldTarget.value, asError, formId, "field meta");
      }
      if (!bag.option || !Array.isArray(field.options)) continue;
      for (const option of field.options) {
        if (!option || typeof option !== "object") continue;
        const optionTarget = metaSchemaTarget(
          (option as { meta?: unknown }).meta,
          bag.namespace,
        );
        if (optionTarget.present) {
          assertMeta(
            bag.option,
            optionTarget.value,
            asError,
            formId,
            "option meta",
          );
        }
      }
    }
  }
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

function assertFormDocument(
  formId: string,
  form: { meta?: unknown; fields: readonly Record<string, unknown>[] },
  fieldTypes: ReadonlyMap<string, FieldTypeDefinition>,
  metaSchemas: readonly AppliedMetaSchema[],
  asError: "init" | "request",
): void {
  assertFieldDocuments(formId, form.fields, fieldTypes, asError);
  assertDocumentMeta(formId, form, metaSchemas, asError);
  const showWhenIssue = collectShowWhenIssues(form.fields as FormField[])[0];
  if (showWhenIssue) fail(asError, formId, showWhenIssue);
}

export function assertFormsConfig(
  forms: Record<string, unknown>,
  fieldTypes: ReadonlyMap<string, FieldTypeDefinition>,
  metaSchemas: readonly AppliedMetaSchema[] = [],
): void {
  for (const [id, form] of Object.entries(forms)) {
    const parsed = formDefinitionSchema.safeParse(form);
    if (!parsed.success) {
      throw new Error(`Invalid form "${id}": ${z.prettifyError(parsed.error)}`);
    }
    assertFormDocument(id, parsed.data, fieldTypes, metaSchemas, "init");
  }
}

export function snapshotFromConfig(
  forms: Record<string, unknown>,
  formId: string,
  fieldTypes: ReadonlyMap<string, FieldTypeDefinition>,
  metaSchemas: readonly AppliedMetaSchema[] = [],
): FormSnapshot {
  const parsed = formDefinitionSchema.safeParse(forms[formId]);
  if (!parsed.success) {
    throw errors.validationError(`Invalid form "${formId}"`);
  }
  assertFormDocument(formId, parsed.data, fieldTypes, metaSchemas, "request");
  return normalizeFormSnapshot({ id: formId, ...parsed.data });
}

export function parseLiveSnapshot(
  form: unknown,
  fieldTypes: ReadonlyMap<string, FieldTypeDefinition>,
  metaSchemas: readonly AppliedMetaSchema[] = [],
): FormSnapshot {
  const parsed = safeParseFormSnapshot(form);
  if (!parsed.success) {
    throw errors.validationError("Invalid form");
  }
  assertFormDocument(
    parsed.data.id,
    parsed.data,
    fieldTypes,
    metaSchemas,
    "request",
  );
  return parsed.data;
}

export async function resolveLiveForm(
  config: ResolvedDimahFormConfig,
  idOrSlug: string,
): Promise<FormSnapshot> {
  if (Object.hasOwn(config.forms, idOrSlug)) {
    return snapshotFromConfig(
      config.forms,
      idOrSlug,
      config.fieldTypes,
      config.metaSchemas,
    );
  }
  for (const formId of Object.keys(config.forms)) {
    const snapshot = snapshotFromConfig(
      config.forms,
      formId,
      config.fieldTypes,
      config.metaSchemas,
    );
    if (snapshot.slug === idOrSlug) return snapshot;
  }
  const stored = await config.database.getForm(idOrSlug);
  if (!stored) {
    throw errors.unknownForm(idOrSlug);
  }
  return parseLiveSnapshot(stored, config.fieldTypes, config.metaSchemas);
}

export async function findLiveForm(
  config: ResolvedDimahFormConfig,
  idOrSlug: string,
): Promise<FormSnapshot | undefined> {
  try {
    return await resolveLiveForm(config, idOrSlug);
  } catch (error) {
    if (isFormErrorCode(error, "UNKNOWN_FORM")) return undefined;
    throw error;
  }
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
      snapshotFromConfig(
        config.forms,
        formId,
        config.fieldTypes,
        config.metaSchemas,
      ),
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
      extra.push(parseLiveSnapshot(form, config.fieldTypes, config.metaSchemas));
    } catch {
      continue;
    }
  }
  return fromConfig
    .concat(extra)
    .toSorted((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""));
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
      config.metaSchemas,
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
