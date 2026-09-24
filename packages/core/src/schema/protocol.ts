import * as z from "zod";

import {
  formSnapshotSchema,
  formStatusSchema,
  type FormSnapshot,
} from "./definition";
import { formIdSchema, responseIdSchema, trimmedString } from "./shared";

export const LIST_DEFAULT_LIMIT = 50;
export const LIST_MAX_LIMIT = 100;

export const answersSchema = z.record(z.string(), z.unknown());

export const responseStatusSchema = z.enum(["draft", "submitted", "abandoned"]);

export const listPageQueryFields = {
  limit: z.coerce.number().pipe(z.int().min(1).max(LIST_MAX_LIMIT)).optional(),
  offset: z.coerce.number().pipe(z.int().nonnegative()).optional(),
};

/** Query datetime (ISO-8601). Invalid strings fail validation. */
export const isoDateTimeQuerySchema = z
  .string()
  .trim()
  .min(1)
  .refine((value) => !Number.isNaN(Date.parse(value)), {
    error: "Invalid datetime",
  });

export const responseListFilterFields = {
  formId: formIdSchema.optional(),
  respondentId: trimmedString.optional(),
  status: responseStatusSchema.optional(),
  /** Inclusive lower bound on `submittedAt`. Rows with no submit time are excluded. */
  submittedFrom: isoDateTimeQuerySchema.optional(),
  /** Inclusive upper bound on `submittedAt`. Rows with no submit time are excluded. */
  submittedTo: isoDateTimeQuerySchema.optional(),
  /** Exclusive lower bound on `updatedAt` (warehouse incremental sync). */
  updatedAfter: isoDateTimeQuerySchema.optional(),
};

export type ResponseStatus = z.output<typeof responseStatusSchema>;

/** List query shared by responses, dataset, and insights. */
export type ResponseListFilter = {
  formId?: string;
  respondentId?: string;
  status?: ResponseStatus;
  /** Inclusive lower bound on `submittedAt`. Rows with no submit time are excluded. */
  submittedFrom?: string;
  /** Inclusive upper bound on `submittedAt`. Rows with no submit time are excluded. */
  submittedTo?: string;
  /** Exclusive lower bound on `updatedAt`. */
  updatedAfter?: string;
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
  /**
   * When true, return the latest draft for `formId` + `respondentId` if one
   * exists. Requires `respondentId`. Otherwise create a new response.
   */
  resume: z.boolean().optional(),
});

export const getResponseQuerySchema = z.strictObject({
  responseId: responseIdSchema,
});

export const listFormsQuerySchema = z.strictObject({
  status: formStatusSchema.optional(),
  ...listPageQueryFields,
});

export const listResponsesQuerySchema = z.strictObject({
  ...responseListFilterFields,
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

export const reopenResponseBodySchema = z.strictObject({
  responseId: responseIdSchema,
  updatedAt: z.string().optional(),
});

export const deleteResponseBodySchema = z.strictObject({
  responseId: responseIdSchema,
});

export const responseRecordSchema = z.strictObject({
  id: responseIdSchema,
  formId: formIdSchema,
  status: responseStatusSchema,
  definition: formSnapshotSchema,
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
  forms: z.array(formSnapshotSchema),
  limit: z.int(),
  offset: z.int(),
  nextOffset: z.int().nullable(),
});

export const responseListSchema = z.strictObject({
  responses: z.array(z.union([responseRecordSchema, responseSummarySchema])),
  limit: z.int(),
  offset: z.int(),
  nextOffset: z.int().nullable(),
  total: z.int().nonnegative(),
});

export type FormAnswers = z.output<typeof answersSchema>;

/** Stored response. `definition` is the questionnaire frozen at start. */
export type ResponseRecord = {
  id: string;
  formId: string;
  /** `"draft"`, `"submitted"`, or `"abandoned"`. */
  status: ResponseStatus;
  /** Copy of the form at `startResponse`. Later edits to the live form do not change it. */
  definition: FormSnapshot;
  /** Answer map. A missing key is unanswered. Draft patches use `null` to delete a key. */
  answers: FormAnswers;
  /**
   * Owner. Set on the server in `onStart`.
   * `null` when the response is anonymous.
   */
  respondentId: string | null;
  /** Set when status becomes `"submitted"`. `null` until then. */
  submittedAt: string | null;
  createdAt: string;
  /** Compare-and-swap token. Send it back on the next draft or submit. */
  updatedAt: string;
};

/** List row when `include` is `"summary"`. `definition` and `answers` are omitted. */
export type ResponseSummary = {
  id: string;
  formId: string;
  status: ResponseStatus;
  respondentId: string | null;
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
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
  responses: (ResponseRecord | ResponseSummary)[];
  limit: number;
  offset: number;
  nextOffset: number | null;
  total: number;
};

function parsedTime(value: string | null | undefined): number | undefined {
  if (value == null || value.length === 0) return undefined;
  const time = Date.parse(value);
  return Number.isNaN(time) ? undefined : time;
}

/**
 * Store / in-memory predicate for {@link ResponseListFilter}.
 * `submittedFrom` / `submittedTo` are inclusive and drop rows with no
 * `submittedAt`. `updatedAfter` is exclusive.
 */
export function matchesResponseListFilter(
  row: {
    formId: string;
    respondentId: string | null;
    status: ResponseStatus;
    submittedAt: string | null;
    updatedAt: string;
  },
  query?: ResponseListFilter,
): boolean {
  if (!query) return true;
  if (query.formId && row.formId !== query.formId) return false;
  if (query.respondentId && row.respondentId !== query.respondentId) {
    return false;
  }
  if (query.status && row.status !== query.status) return false;
  if (query.submittedFrom !== undefined || query.submittedTo !== undefined) {
    const submitted = parsedTime(row.submittedAt);
    if (submitted === undefined) return false;
    const from = parsedTime(query.submittedFrom);
    if (from !== undefined && submitted < from) return false;
    const to = parsedTime(query.submittedTo);
    if (to !== undefined && submitted > to) return false;
  }
  if (query.updatedAfter !== undefined) {
    const updated = parsedTime(row.updatedAt);
    const after = parsedTime(query.updatedAfter);
    if (updated === undefined || after === undefined || updated <= after) {
      return false;
    }
  }
  return true;
}

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

export function toResponseSummary(
  row: ResponseRecord | ResponseSummary,
): ResponseSummary {
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
