import {
  formatAnswer,
  type FieldTypeDefinition,
  type FormField,
  type ResponseRecord,
} from "@dimah-form/core";

import { snapshotKey, type SnapshotKeyCache } from "./hash";
import {
  DATASET_SPEC,
  type DatasetAttachment,
  type DatasetRecord,
  type DatasetScores,
} from "./spec";

export type ProjectFieldTypes =
  ReadonlyMap<string, FieldTypeDefinition> | readonly FieldTypeDefinition[];

export type ProjectResponseOptions = {
  fieldTypes?: ProjectFieldTypes;
  scores?: DatasetScores;
  /** HTTP default on; encode default off. */
  includeRespondentId?: boolean;
  snapshotKey?: string;
  snapshotKeyCache?: SnapshotKeyCache;
};

const BINARY_KEYS = new Set(["bytes", "data", "content", "buffer"]);

function asRecord(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return;
  return value as Record<string, unknown>;
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function asFinite(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
}

function stripBinary(value: unknown): unknown {
  const record = asRecord(value);
  if (!record) return value;
  let changed = false;
  const next: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(record)) {
    if (BINARY_KEYS.has(key)) {
      changed = true;
      continue;
    }
    next[key] = item;
  }
  return changed ? next : value;
}

function attachmentOf(value: unknown): DatasetAttachment | undefined {
  const record = asRecord(value);
  if (!record) return;
  const id = asString(record.id);
  const url = asString(record.url);
  const name = asString(record.name) ?? asString(record.filename);
  const contentType = asString(record.contentType) ?? asString(record.mimeType);
  const size = asFinite(record.size);
  if (!id && !url && !name) return;
  if (!id && !url && size === undefined && contentType === undefined) return;
  return {
    ...(id ? { id } : {}),
    ...(url ? { url } : {}),
    ...(name ? { name } : {}),
    ...(contentType ? { contentType } : {}),
    ...(size !== undefined ? { size } : {}),
  };
}

function fieldValue(
  field: FormField,
  answers: ResponseRecord["answers"],
  fieldTypes: ProjectFieldTypes | undefined,
): DatasetRecord["fields"][number] {
  const raw = Object.hasOwn(answers, field.id) ? answers[field.id] : null;
  const value = raw == null ? null : stripBinary(raw);
  const attachment = value == null ? undefined : attachmentOf(value);
  return {
    id: field.id,
    type: field.type,
    value: value ?? null,
    formatted: formatAnswer(field, value, fieldTypes),
    ...(attachment ? { attachment } : {}),
  };
}

/**
 * Project a stored response onto a {@link DatasetRecord}. Uses the
 * **response definition snapshot**, never the live questionnaire.
 * One entry per snapshot field (unanswered → `value: null`).
 */
export async function projectResponse(
  row: ResponseRecord,
  options: ProjectResponseOptions = {},
): Promise<DatasetRecord> {
  const key =
    options.snapshotKey ??
    (await snapshotKey(row.definition, options.snapshotKeyCache));
  const record: DatasetRecord = {
    spec: DATASET_SPEC,
    id: row.id,
    formId: row.formId,
    status: row.status,
    submittedAt: row.submittedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    snapshotKey: key,
    fields: row.definition.fields.map((field) =>
      fieldValue(field, row.answers, options.fieldTypes),
    ),
  };
  if (options.includeRespondentId) {
    record.respondentId = row.respondentId;
  }
  if (options.scores) {
    record.scores = options.scores;
  }
  return record;
}
