import * as z from "zod";

import {
  LIST_MAX_LIMIT,
  fieldIdSchema,
  formIdSchema,
  responseIdSchema,
  responseStatusSchema,
} from "@dimah-form/core";

const nonEmpty = z.string().trim().min(1);

export const DATASET_SPEC = "dimah.dataset/v1" as const;

export const datasetSpecSchema = z.literal(DATASET_SPEC);

const listPageQueryFields = {
  limit: z.coerce.number().pipe(z.int().min(1).max(LIST_MAX_LIMIT)).optional(),
  offset: z.coerce.number().pipe(z.int().nonnegative()).optional(),
};

export const datasetPageQuerySchema = z.strictObject({
  formId: formIdSchema,
  status: responseStatusSchema.optional(),
  ...listPageQueryFields,
});

export const liveCodebookQuerySchema = z.strictObject({
  formId: formIdSchema,
});

export const datasetFieldValueSchema = z.object({
  id: fieldIdSchema,
  type: nonEmpty,
  value: z.unknown(),
  formatted: z.string(),
});

export type DatasetFieldValue = z.output<typeof datasetFieldValueSchema>;

export const datasetScoreVariableSchema = z.object({
  raw: z.number().nullable(),
  min: z.number().optional(),
  max: z.number().optional(),
  missing: z.number().int().nonnegative(),
  band: z.string().optional(),
  complete: z.boolean(),
  label: z.string().optional(),
});

export type DatasetScoreVariable = z.output<typeof datasetScoreVariableSchema>;

export const datasetScoresSchema = z.object({
  variables: z.record(z.string(), datasetScoreVariableSchema),
  complete: z.boolean(),
});

export type DatasetScores = z.output<typeof datasetScoresSchema>;

export const datasetRecordSchema = z.object({
  spec: datasetSpecSchema,
  id: responseIdSchema,
  formId: formIdSchema,
  status: responseStatusSchema,
  submittedAt: z.string().nullable(),
  createdAt: z.string(),
  snapshotKey: nonEmpty,
  respondentId: z.string().nullable().optional(),
  fields: z.array(datasetFieldValueSchema),
  scores: datasetScoresSchema.optional(),
});

export type DatasetRecord = z.output<typeof datasetRecordSchema>;

export const codebookOptionSchema = z.object({
  value: nonEmpty,
  label: z.string(),
});

export type CodebookOption = z.output<typeof codebookOptionSchema>;

export const codebookSnapshotSchema = z.object({
  key: nonEmpty,
  n: z.number().int().nonnegative(),
  firstSeenAt: z.string().optional(),
  lastSeenAt: z.string().optional(),
});

export type CodebookSnapshot = z.output<typeof codebookSnapshotSchema>;

export const codebookLabelConflictSchema = z.object({
  snapshotKey: nonEmpty,
  label: z.string(),
  options: z.array(codebookOptionSchema).optional(),
});

export type CodebookLabelConflict = z.output<
  typeof codebookLabelConflictSchema
>;

export const codebookTypeConflictSchema = z.object({
  snapshotKey: nonEmpty,
  type: nonEmpty,
});

export type CodebookTypeConflict = z.output<typeof codebookTypeConflictSchema>;

export const codebookFieldSchema = z.object({
  id: fieldIdSchema,
  type: nonEmpty,
  label: z.string(),
  options: z.array(codebookOptionSchema).optional(),
  inSnapshots: z.array(nonEmpty),
  labelConflicts: z.array(codebookLabelConflictSchema).optional(),
  typeConflicts: z.array(codebookTypeConflictSchema).optional(),
});

export type CodebookField = z.output<typeof codebookFieldSchema>;

export const codebookScoreVariableSchema = z.object({
  id: fieldIdSchema,
  label: z.string().optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  inSnapshots: z.array(nonEmpty),
});

export type CodebookScoreVariable = z.output<
  typeof codebookScoreVariableSchema
>;

export const codebookScoreBandSchema = z.object({
  variable: fieldIdSchema,
  from: z.number().optional(),
  to: z.number().optional(),
  label: z.string(),
  inSnapshots: z.array(nonEmpty),
});

export type CodebookScoreBand = z.output<typeof codebookScoreBandSchema>;

export const codebookScoresSchema = z.object({
  variables: z.array(codebookScoreVariableSchema),
  bands: z.array(codebookScoreBandSchema).optional(),
});

export type CodebookScores = z.output<typeof codebookScoresSchema>;

export const codebookSchema = z.object({
  spec: datasetSpecSchema,
  snapshots: z.array(codebookSnapshotSchema),
  fields: z.array(codebookFieldSchema),
  scores: codebookScoresSchema.optional(),
});

export type Codebook = z.output<typeof codebookSchema>;

export const datasetPageSchema = z.object({
  spec: datasetSpecSchema,
  records: z.array(datasetRecordSchema),
  codebook: codebookSchema,
  limit: z.int(),
  offset: z.int(),
  nextOffset: z.int().nullable(),
});

export type DatasetPage = z.output<typeof datasetPageSchema>;

export function sortDatasetIds(ids: readonly string[]): string[] {
  return [...ids].sort((a, b) => a.localeCompare(b, "en", { numeric: true }));
}

export function emptyCodebook(): Codebook {
  return {
    spec: DATASET_SPEC,
    snapshots: [],
    fields: [],
  };
}
