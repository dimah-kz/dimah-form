import {
  formDefinitionSchema,
  formStatusSchema,
  normalizeFormSnapshot,
  responseRecordSchema,
  type FormSnapshot,
  type FormStatus,
  type ResponseRecord,
} from "@dimah-form/core";

function toIso(value: Date | string): string;
function toIso(value: Date | string | null | undefined): string | null;
function toIso(value: Date | string | null | undefined): string | null {
  if (value == null) return null;
  return value instanceof Date ? value.toISOString() : value;
}

function toDate(value: string | null): Date | null {
  return value == null ? null : new Date(value);
}

function toFormStatus(value: string | undefined): FormStatus {
  const parsed = formStatusSchema.safeParse(value);
  return parsed.success ? parsed.data : "active";
}

/** Raw `response` row as returned by the FumaDB ORM. */
export type ResponseRow = {
  id: string;
  questionnaireId: string;
  status: string;
  definition: unknown;
  answers: unknown;
  respondentId?: string | null;
  submittedAt: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
};

/** Raw `questionnaire` row as returned by the FumaDB ORM. */
export type QuestionnaireRow = {
  id: string;
  slug?: string | null;
  title: string;
  definition: unknown;
  status: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
};

export function toResponseRecord(row: ResponseRow): ResponseRecord {
  return responseRecordSchema.parse({
    id: row.id,
    formId: row.questionnaireId,
    status: row.status,
    definition: row.definition,
    answers: row.answers ?? {},
    respondentId: row.respondentId ?? null,
    submittedAt: toIso(row.submittedAt),
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  });
}

export function toFormSnapshot(row: QuestionnaireRow): FormSnapshot {
  const definition = formDefinitionSchema.parse(row.definition);
  const createdAt = row.createdAt != null ? toIso(row.createdAt) : undefined;
  const updatedAt = row.updatedAt != null ? toIso(row.updatedAt) : undefined;
  return normalizeFormSnapshot({
    ...definition,
    id: row.id,
    title: definition.title,
    fields: definition.fields,
    slug: row.slug ?? definition.slug,
    status: toFormStatus(row.status),
    ...(createdAt ? { createdAt } : {}),
    ...(updatedAt ? { updatedAt } : {}),
  });
}

export function toResponseColumns(row: ResponseRecord) {
  return {
    id: row.id,
    questionnaireId: row.formId,
    status: row.status,
    definition: row.definition,
    answers: row.answers,
    respondentId: row.respondentId,
    submittedAt: toDate(row.submittedAt),
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
  };
}

export function toQuestionnaireColumns(form: FormSnapshot, updatedAt: Date) {
  const {
    id: _id,
    createdAt: _createdAt,
    updatedAt: _updatedAt,
    ...document
  } = form;
  return {
    id: form.id,
    slug: form.slug,
    title: form.title,
    definition: document,
    status: form.status,
    updatedAt,
  };
}
