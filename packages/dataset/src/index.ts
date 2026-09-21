export {
  datasetPlugin,
  type DatasetPluginOptions,
  type OnProjectContext,
} from "./plugin";
export {
  DATASET_SPEC,
  codebookSchema,
  datasetAttachmentSchema,
  datasetCodebookQuerySchema,
  datasetCodebookResultSchema,
  datasetPageQuerySchema,
  datasetPageSchema,
  datasetRecordSchema,
  emptyCodebook,
  liveCodebookQuerySchema,
  sortDatasetIds,
  type Codebook,
  type CodebookField,
  type CodebookFieldConstraints,
  type CodebookFieldHistory,
  type CodebookFieldScoring,
  type CodebookOption,
  type CodebookScoreFormula,
  type CodebookScores,
  type CodebookSnapshot,
  type DatasetAttachment,
  type DatasetCodebookResult,
  type DatasetFieldValue,
  type DatasetPage,
  type DatasetRecord,
  type DatasetScores,
} from "./spec";
export {
  canonicalJson,
  instrumentSlice,
  snapshotKey,
  type SnapshotKeyCache,
} from "./hash";
export { projectResponse, type ProjectResponseOptions } from "./project";
export { tryScoreResponse } from "@dimah-form/scoring/document";
export {
  buildCodebook,
  liveCodebook,
  mergeCodebooks,
  type CodebookSource,
} from "./codebook";
export {
  DATASET_IDENTITY_COLUMNS,
  createCsvEncoder,
  csvFieldColumn,
  datasetCsvColumns,
  toCsv,
  toCsvLabels,
  toDataPackage,
  toJsonl,
  toJsonlLine,
  type CsvEncoder,
  type CsvMode,
  type DataPackageFiles,
  type EncodeOptions,
} from "./encode";
export {
  createDatasetReader,
  type CreateDatasetReaderOptions,
  type DatasetCodebookFn,
  type DatasetPageFn,
  type DatasetPageQuery,
  type DatasetReaderResult,
} from "./reader";
export { DATASET_ID } from "./errors";
export { DATASET_ROUTES } from "./routes";
