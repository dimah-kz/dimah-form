import * as z from "zod";

import {
  fieldIdSchema,
  formIdSchema,
  listPageQueryFields,
  responseIdSchema,
  responseListFilterFields,
  responseStatusSchema,
  type ResponseStatus,
} from "@dimah-form/core";

const nonEmpty = z.string().trim().min(1);

export const DATASET_SPEC = "dimah.dataset/v1" as const;

export const datasetSpecSchema = z.literal(DATASET_SPEC);

export const datasetPageQuerySchema = z.strictObject({
  ...responseListFilterFields,
  formId: formIdSchema,
  ...listPageQueryFields,
});

export const datasetCodebookQuerySchema = z.strictObject({
  ...responseListFilterFields,
  formId: formIdSchema,
  /** Lowers the plugin walk cap. Cannot raise it. */
  maxRows: z.coerce.number().pipe(z.int().min(1)).optional(),
});

export const liveCodebookQuerySchema = z.strictObject({
  formId: formIdSchema,
});

export const datasetAttachmentSchema = z.object({
  id: z.string().optional(),
  url: z.string().optional(),
  name: z.string().optional(),
  contentType: z.string().optional(),
  size: z.number().optional(),
});

export type DatasetAttachment = z.output<typeof datasetAttachmentSchema>;

export const datasetFieldValueSchema = z.object({
  id: fieldIdSchema,
  type: nonEmpty,
  value: z.unknown(),
  formatted: z.string(),
  attachment: datasetAttachmentSchema.optional(),
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
  updatedAt: z.string(),
  snapshotKey: nonEmpty,
  respondentId: z.string().nullable().optional(),
  fields: z.array(datasetFieldValueSchema),
  scores: datasetScoresSchema.optional(),
});

/** One projected response. Join `snapshotKey` to the historical codebook, not the live form. */
export type DatasetRecord = {
  spec: "dimah.dataset/v1";
  id: string;
  formId: string;
  status: ResponseStatus;
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
  /** SHA-256 of the RFC 8785 instrument slice that produced this row. */
  snapshotKey: string;
  /** Omitted unless the projection includes the owner. */
  respondentId?: string | null;
  fields: DatasetFieldValue[];
  /** Omitted when the snapshot has no valid scoring meta. */
  scores?: DatasetScores;
};

export const codebookScoringMissingSchema = z.enum([
  "zero",
  "omit",
  "incomplete",
]);

export type CodebookScoringMissing = z.output<
  typeof codebookScoringMissingSchema
>;

export const codebookScoringAddSchema = z.object({
  variable: fieldIdSchema,
  points: z.number(),
});

export type CodebookScoringAdd = z.output<typeof codebookScoringAddSchema>;

export const codebookOptionSchema = z.object({
  value: nonEmpty,
  label: z.string(),
  points: z.number().optional(),
  add: z.array(codebookScoringAddSchema).optional(),
});

export type CodebookOption = z.output<typeof codebookOptionSchema>;

export const codebookFieldScoringSchema = z.object({
  variable: fieldIdSchema,
  reverse: z.boolean().optional(),
});

export type CodebookFieldScoring = z.output<typeof codebookFieldScoringSchema>;

export const codebookSnapshotSchema = z.object({
  key: nonEmpty,
  n: z.number().int().nonnegative(),
  firstSeenAt: z.string().optional(),
  lastSeenAt: z.string().optional(),
});

export type CodebookSnapshot = z.output<typeof codebookSnapshotSchema>;

export const codebookFieldConstraintsSchema = z.object({
  min: z.number().optional(),
  max: z.number().optional(),
  minLength: z.int().nonnegative().optional(),
  maxLength: z.int().nonnegative().optional(),
  integer: z.boolean().optional(),
});

export type CodebookFieldConstraints = z.output<
  typeof codebookFieldConstraintsSchema
>;

/** Field properties that can differ across snapshots. No id, no history. */
export const codebookFieldViewSchema = z.object({
  type: nonEmpty,
  label: z.string(),
  required: z.boolean().optional(),
  description: z.string().optional(),
  showWhen: z.unknown().optional(),
  constraints: codebookFieldConstraintsSchema.optional(),
  options: z.array(codebookOptionSchema).optional(),
  scoring: codebookFieldScoringSchema.optional(),
});

export type CodebookFieldView = z.output<typeof codebookFieldViewSchema>;

export const codebookFieldHistorySchema = codebookFieldViewSchema.extend({
  snapshotKey: nonEmpty,
});

export type CodebookFieldHistory = z.output<typeof codebookFieldHistorySchema>;

export const codebookFieldSchema = codebookFieldViewSchema.extend({
  id: fieldIdSchema,
  inSnapshots: z.array(nonEmpty),
  history: z.array(codebookFieldHistorySchema).optional(),
});

export type CodebookField = z.output<typeof codebookFieldSchema>;

export const codebookScoreVariableViewSchema = z.object({
  label: z.string().optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  missing: codebookScoringMissingSchema.optional(),
});

export type CodebookScoreVariableView = z.output<
  typeof codebookScoreVariableViewSchema
>;

export const codebookScoreVariableHistorySchema =
  codebookScoreVariableViewSchema.extend({
    snapshotKey: nonEmpty,
  });

export type CodebookScoreVariableHistory = z.output<
  typeof codebookScoreVariableHistorySchema
>;

export const codebookScoreVariableSchema =
  codebookScoreVariableViewSchema.extend({
    id: fieldIdSchema,
    inSnapshots: z.array(nonEmpty),
    history: z.array(codebookScoreVariableHistorySchema).optional(),
  });

export type CodebookScoreVariable = z.output<
  typeof codebookScoreVariableSchema
>;

export const codebookScoreBandHistorySchema = z.object({
  snapshotKey: nonEmpty,
  from: z.number().optional(),
  to: z.number().optional(),
});

export type CodebookScoreBandHistory = z.output<
  typeof codebookScoreBandHistorySchema
>;

export const codebookScoreBandSchema = z.object({
  variable: fieldIdSchema,
  from: z.number().optional(),
  to: z.number().optional(),
  label: z.string(),
  inSnapshots: z.array(nonEmpty),
  history: z.array(codebookScoreBandHistorySchema).optional(),
});

export type CodebookScoreBand = z.output<typeof codebookScoreBandSchema>;

export const codebookScoreFormulaViewSchema = z.object({
  label: z.string().optional(),
  op: z.literal("sum"),
  vars: z.array(fieldIdSchema).min(1),
});

export type CodebookScoreFormulaView = z.output<
  typeof codebookScoreFormulaViewSchema
>;

export const codebookScoreFormulaHistorySchema =
  codebookScoreFormulaViewSchema.extend({
    snapshotKey: nonEmpty,
  });

export type CodebookScoreFormulaHistory = z.output<
  typeof codebookScoreFormulaHistorySchema
>;

export const codebookScoreFormulaSchema = codebookScoreFormulaViewSchema.extend(
  {
    id: fieldIdSchema,
    inSnapshots: z.array(nonEmpty),
    history: z.array(codebookScoreFormulaHistorySchema).optional(),
  },
);

export type CodebookScoreFormula = z.output<typeof codebookScoreFormulaSchema>;

export const codebookScoresSchema = z.object({
  variables: z.array(codebookScoreVariableSchema),
  bands: z.array(codebookScoreBandSchema).optional(),
  formulas: z.array(codebookScoreFormulaSchema).optional(),
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
  total: z.int().nonnegative(),
});

export type DatasetPage = z.output<typeof datasetPageSchema>;

export const datasetCodebookResultSchema = z.object({
  spec: datasetSpecSchema,
  codebook: codebookSchema,
  total: z.int().nonnegative(),
  truncated: z.boolean(),
});

export type DatasetCodebookResult = z.output<
  typeof datasetCodebookResultSchema
>;

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
