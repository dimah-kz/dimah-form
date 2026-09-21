import * as z from "zod";

import {
  fieldIdSchema,
  formIdSchema,
  responseListFilterFields,
} from "@dimah-form/core";

const wherePair = {
  whereField: fieldIdSchema.optional(),
  whereValue: z.string().optional(),
};

function whereTogether<T extends { whereField?: string; whereValue?: string }>(
  query: T,
): boolean {
  return (query.whereField == null) === (query.whereValue == null);
}

export const insightsSummaryQuerySchema = z
  .strictObject({
    ...responseListFilterFields,
    formId: formIdSchema,
    ...wherePair,
    bucket: z.enum(["day"]).optional(),
    maxRows: z.coerce.number().pipe(z.int().min(1)).optional(),
  })
  .refine(whereTogether, {
    message: "whereField and whereValue must be used together",
  });

export const insightsCrosstabQuerySchema = z
  .strictObject({
    ...responseListFilterFields,
    formId: formIdSchema,
    row: fieldIdSchema,
    col: fieldIdSchema,
    ...wherePair,
    maxRows: z.coerce.number().pipe(z.int().min(1)).optional(),
  })
  .refine(whereTogether, {
    message: "whereField and whereValue must be used together",
  });

export const insightsStatusCountsSchema = z.object({
  draft: z.int().nonnegative(),
  submitted: z.int().nonnegative(),
  abandoned: z.int().nonnegative(),
});

export type InsightsStatusCounts = z.output<typeof insightsStatusCountsSchema>;

export const insightsFieldValueSchema = z.object({
  value: z.string(),
  label: z.string().optional(),
  n: z.int().nonnegative(),
  pct: z.number(),
});

export type InsightsFieldValue = z.output<typeof insightsFieldValueSchema>;

export const insightsNumericSchema = z.object({
  min: z.number(),
  max: z.number(),
  mean: z.number(),
  stdev: z.number(),
});

export type InsightsNumeric = z.output<typeof insightsNumericSchema>;

export const insightsDateRangeSchema = z.object({
  min: z.string(),
  max: z.string(),
});

export type InsightsDateRange = z.output<typeof insightsDateRangeSchema>;

export const insightsFieldSchema = z.object({
  id: fieldIdSchema,
  type: z.string().trim().min(1),
  label: z.string(),
  n: z.int().nonnegative(),
  hidden: z.int().nonnegative(),
  unanswered: z.int().nonnegative(),
  values: z.array(insightsFieldValueSchema).optional(),
  numeric: insightsNumericSchema.optional(),
  dates: insightsDateRangeSchema.optional(),
});

export type InsightsField = z.output<typeof insightsFieldSchema>;

export const insightsScoreBandCountSchema = z.object({
  label: z.string(),
  n: z.int().nonnegative(),
  pct: z.number(),
});

export const insightsScoreVariableSchema = z.object({
  id: fieldIdSchema,
  label: z.string().optional(),
  n: z.int().nonnegative(),
  complete: z.int().nonnegative(),
  min: z.number().optional(),
  max: z.number().optional(),
  mean: z.number().nullable(),
  stdev: z.number().nullable(),
  bands: z.array(insightsScoreBandCountSchema).optional(),
});

export type InsightsScoreVariable = z.output<
  typeof insightsScoreVariableSchema
>;

export const insightsSeriesPointSchema = z.object({
  t: z.string(),
  n: z.int().nonnegative(),
});

export const insightsSeriesSchema = z.object({
  bucket: z.literal("day"),
  points: z.array(insightsSeriesPointSchema),
});

export type InsightsSeries = z.output<typeof insightsSeriesSchema>;

export const insightsSummarySchema = z.object({
  formId: formIdSchema,
  total: z.int().nonnegative(),
  byStatus: insightsStatusCountsSchema,
  submittedAt: z
    .object({
      min: z.string(),
      max: z.string(),
    })
    .optional(),
  completion: z.object({
    submitted: z.int().nonnegative(),
    complete: z.int().nonnegative(),
    rate: z.number().nullable(),
  }),
  fields: z.array(insightsFieldSchema),
  scores: z
    .object({
      variables: z.array(insightsScoreVariableSchema),
    })
    .optional(),
  series: insightsSeriesSchema.optional(),
  scanned: z.int().nonnegative(),
  truncated: z.boolean(),
});

export type InsightsSummary = z.output<typeof insightsSummarySchema>;

export const insightsCrosstabAxisSchema = z.object({
  id: fieldIdSchema,
  label: z.string(),
});

export const insightsCrosstabCellSchema = z.object({
  row: z.string(),
  col: z.string(),
  n: z.int().nonnegative(),
});

export const insightsCrosstabTotalSchema = z.object({
  value: z.string(),
  label: z.string().optional(),
  n: z.int().nonnegative(),
});

export const insightsCrosstabSchema = z.object({
  formId: formIdSchema,
  row: insightsCrosstabAxisSchema,
  col: insightsCrosstabAxisSchema,
  /** Respondents who contributed at least one cell (not multiSelect tokens). */
  n: z.int().nonnegative(),
  cells: z.array(insightsCrosstabCellSchema),
  rowTotals: z.array(insightsCrosstabTotalSchema),
  colTotals: z.array(insightsCrosstabTotalSchema),
  scanned: z.int().nonnegative(),
  truncated: z.boolean(),
});

export type InsightsCrosstab = z.output<typeof insightsCrosstabSchema>;
