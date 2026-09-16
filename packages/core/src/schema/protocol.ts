import * as z from "zod";

import {
  formSnapshotSchema,
  formStatusSchema,
  normalizeFormSnapshot,
  type FormSnapshot,
} from "./definition";
import { formIdSchema, responseIdSchema, trimmedString } from "./shared";

export const LIST_DEFAULT_LIMIT = 50;
export const LIST_MAX_LIMIT = 100;

export const answersSchema = z.record(z.string(), z.unknown());

const listPageQueryFields = {
  limit: z.coerce.number().int().min(1).max(LIST_MAX_LIMIT).optional(),
  offset: z.coerce.number().int().min(0).optional(),
};

export const getFormQuerySchema = z.strictObject({
  formId: formIdSchema,
});

export const saveFormBodySchema = formSnapshotSchema;

export const deleteFormBodySchema = z.strictObject({
  formId: formIdSchema,
});

export const startResponseBodySchema = z.strictObject({
  formId: formIdSchema,
  respondentId: trimmedString.optional(),
});

export const getResponseQuerySchema = z.strictObject({
  responseId: responseIdSchema,
});

export const listFormsQuerySchema = z.strictObject({
  status: formStatusSchema.optional(),
  ...listPageQueryFields,
});

export const listResponsesQuerySchema = z.strictObject({
  formId: formIdSchema.optional(),
  respondentId: trimmedString.optional(),
  status: z.enum(["draft", "submitted", "abandoned"]).optional(),
  include: z.enum(["summary", "full"]).optional(),
  ...listPageQueryFields,
});

export const saveDraftBodySchema = z.strictObject({
  responseId: responseIdSchema,
  answers: answersSchema,
  updatedAt: z.string().optional(),
});

export const submitResponseBodySchema = z.strictObject({
  responseId: responseIdSchema,
  /** Omit to submit the stored draft as-is. Present values replace the whole object. */
  answers: answersSchema.optional(),
  updatedAt: z.string().optional(),
});

export const abandonResponseBodySchema = z.strictObject({
  responseId: responseIdSchema,
  updatedAt: z.string().optional(),
});

export const deleteResponseBodySchema = z.strictObject({
  responseId: responseIdSchema,
});

export const responseStatusSchema = z.enum(["draft", "submitted", "abandoned"]);

export const responseRecordSchema = z.strictObject({
  id: responseIdSchema,
  formId: formIdSchema,
  status: responseStatusSchema,
  definition: formSnapshotSchema.transform(normalizeFormSnapshot),
  answers: answersSchema,
  respondentId: z.string().nullable(),
  submittedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const responseSummarySchema = responseRecordSchema.omit({
  answers: true,
  definition: true,
});

export const formListSchema = z.strictObject({
  forms: z.array(formSnapshotSchema.transform(normalizeFormSnapshot)),
  limit: z.number().int(),
  offset: z.number().int(),
  nextOffset: z.number().int().nullable(),
});

export const responseListSchema = z.strictObject({
  responses: z.array(z.union([responseRecordSchema, responseSummarySchema])),
  limit: z.number().int(),
  offset: z.number().int(),
  nextOffset: z.number().int().nullable(),
});

export type FormAnswers = z.output<typeof answersSchema>;
export type ResponseStatus = z.output<typeof responseStatusSchema>;
export type ResponseRecord = Omit<
  z.output<typeof responseRecordSchema>,
  "definition"
> & {
  definition: FormSnapshot;
};
export type ResponseSummary = z.output<typeof responseSummarySchema> & {
  answers?: never;
  definition?: never;
};
export type FormList = {
  forms: FormSnapshot[];
  limit: number;
  offset: number;
  nextOffset: number | null;
};
export type ResponseList = {
  responses: Array<ResponseRecord | ResponseSummary>;
  limit: number;
  offset: number;
  nextOffset: number | null;
};

export type ListPageQuery = {
  limit?: number;
  offset?: number;
};

export function normalizeListPage(query: ListPageQuery = {}) {
  return {
    limit: query.limit ?? LIST_DEFAULT_LIMIT,
    offset: query.offset ?? 0,
  };
}

export function paginateItems<T>(
  items: readonly T[],
  limit: number,
  offset: number,
) {
  const slice = items.slice(offset, offset + limit);
  return {
    items: slice,
    nextOffset: offset + limit < items.length ? offset + limit : null,
  };
}

/** `rows` must be fetched as `limit + 1` to detect the next page. */
export function pageFromOverfetch<T>(
  rows: readonly T[],
  limit: number,
  offset: number,
) {
  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : [...rows];
  return {
    items,
    nextOffset: hasMore ? offset + items.length : null,
  };
}

export function toResponseSummary(row: ResponseRecord): ResponseSummary {
  return {
    id: row.id,
    formId: row.formId,
    status: row.status,
    respondentId: row.respondentId,
    submittedAt: row.submittedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
