import * as z from "zod";

import {
  fieldIdSchema,
  formIdSchema,
  responseListFilterFields,
} from "@dimah-form/core";

export const insightsSummaryQuerySchema = z.strictObject({
  ...responseListFilterFields,
  formId: formIdSchema,
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
});

export type InsightsFieldValue = z.output<typeof insightsFieldValueSchema>;

export const insightsFieldSchema = z.object({
  id: fieldIdSchema,
  type: z.string().trim().min(1),
  label: z.string(),
  n: z.int().nonnegative(),
  unanswered: z.int().nonnegative(),
  values: z.array(insightsFieldValueSchema).optional(),
});

export type InsightsField = z.output<typeof insightsFieldSchema>;

export const insightsScoreBandCountSchema = z.object({
  label: z.string(),
  n: z.int().nonnegative(),
});

export const insightsScoreVariableSchema = z.object({
  id: fieldIdSchema,
  label: z.string().optional(),
  n: z.int().nonnegative(),
  complete: z.int().nonnegative(),
  min: z.number().optional(),
  max: z.number().optional(),
  mean: z.number().nullable(),
  bands: z.array(insightsScoreBandCountSchema).optional(),
});

export type InsightsScoreVariable = z.output<
  typeof insightsScoreVariableSchema
>;

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
  }),
  fields: z.array(insightsFieldSchema),
  scores: z
    .object({
      variables: z.array(insightsScoreVariableSchema),
    })
    .optional(),
});

export type InsightsSummary = z.output<typeof insightsSummarySchema>;
