import { defineClientPlugin } from "@dimah-form/core";
import type * as z from "zod";

import { DATASET_ID } from "./errors";
import { DATASET_ROUTES } from "./routes";
import type {
  datasetCodebookQuerySchema,
  datasetPageQuerySchema,
  liveCodebookQuerySchema,
  Codebook,
  DatasetCodebookResult,
  DatasetPage,
} from "./spec";

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

type ClientRequest<T> = T & { headers?: HeadersInit };

export type DatasetPageRequest = ClientRequest<
  z.output<typeof datasetPageQuerySchema>
>;

export type DatasetCodebookRequest = ClientRequest<
  z.output<typeof datasetCodebookQuerySchema>
>;

export type LiveCodebookRequest = ClientRequest<
  z.output<typeof liveCodebookQuerySchema>
>;

function withoutHeaders<T extends { headers?: HeadersInit }>(payload: T) {
  const { headers: _headers, ...query } = payload;
  return Object.fromEntries(
    Object.entries(query).filter(([, value]) => value !== undefined),
  );
}

/**
 * Browser companion. Same id `"dataset"`. Full-file downloads belong on a
 * consumer route — this pages `getDatasetPage` and fetches codebooks.
 */
export function datasetClientPlugin() {
  return defineClientPlugin({
    id: DATASET_ID,
    endpoints: ({ $fetch }) => ({
      getDatasetPage: (payload: DatasetPageRequest) =>
        $fetch<DatasetPage>(DATASET_ROUTES.getDatasetPage.path, {
          method: "GET",
          query: withoutHeaders(payload),
          ...(payload.headers ? { headers: payload.headers } : {}),
        }),
      getDatasetCodebook: (payload: DatasetCodebookRequest) =>
        $fetch<DatasetCodebookResult>(DATASET_ROUTES.getDatasetCodebook.path, {
          method: "GET",
          query: withoutHeaders(payload),
          ...(payload.headers ? { headers: payload.headers } : {}),
        }),
      getLiveCodebook: (payload: LiveCodebookRequest) =>
        $fetch<Codebook>(DATASET_ROUTES.getLiveCodebook.path, {
          method: "GET",
          query: withoutHeaders(payload),
          ...(payload.headers ? { headers: payload.headers } : {}),
        }),
    }),
  });
}
