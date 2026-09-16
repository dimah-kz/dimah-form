import {
  formSnapshotSchema,
  responseRecordSchema,
  type ResponseRecord,
} from "@dimah-form/core";

function toIso(value: Date | string | null | undefined): string | null {
  if (value == null) return null;
  return value instanceof Date ? value.toISOString() : value;
}

function toDate(value: string | null): Date | null {
  return value == null ? null : new Date(value);
}

/** Raw `response` row as returned by the FumaDB ORM. */
export type ResponseRow = {
  id: string;
  questionnaireId: string;
  status: string;
  respondentId: string | null;
  scope: string | null;
  definition: unknown;
  answers: unknown;
  submittedAt: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
};

export function toResponseRecord(row: ResponseRow): ResponseRecord {
  return responseRecordSchema.parse({
    id: row.id,
    formId: row.questionnaireId,
    status: row.status,
    definition: formSnapshotSchema.parse(row.definition),
    answers: row.answers ?? {},
    submittedAt: toIso(row.submittedAt),
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  });
}

export function toResponseColumns(row: ResponseRecord) {
  return {
    id: row.id,
    questionnaireId: row.formId,
    status: row.status,
    respondentId: null as string | null,
    scope: null as string | null,
    definition: row.definition,
    answers: row.answers,
    submittedAt: toDate(row.submittedAt),
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
  };
}

export function toQuestionnaireColumns(row: ResponseRecord) {
  return {
    id: row.formId,
    slug: row.formId,
    title: row.definition.title,
    definition: {
      title: row.definition.title,
      fields: row.definition.fields,
    },
    status: "active",
    scope: null as string | null,
    updatedAt: new Date(row.updatedAt),
  };
}
