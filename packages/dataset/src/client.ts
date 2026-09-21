import { defineClientPlugin } from "@dimah-form/core";

import { DATASET_ID } from "./errors";
import { DATASET_ROUTES } from "./routes";
import type { Codebook, DatasetCodebookResult, DatasetPage } from "./spec";

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
  type CodebookOption,
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

export type DatasetListRequest = {
  formId: string;
  status?: "draft" | "submitted" | "abandoned";
  respondentId?: string;
  submittedFrom?: string;
  submittedTo?: string;
  updatedAfter?: string;
  headers?: HeadersInit;
};

export type DatasetPageRequest = DatasetListRequest & {
  limit?: number;
  offset?: number;
};

export type LiveCodebookRequest = {
  formId: string;
  headers?: HeadersInit;
};

function listQuery(payload: DatasetListRequest) {
  return {
    formId: payload.formId,
    ...(payload.status ? { status: payload.status } : {}),
    ...(payload.respondentId ? { respondentId: payload.respondentId } : {}),
    ...(payload.submittedFrom ? { submittedFrom: payload.submittedFrom } : {}),
    ...(payload.submittedTo ? { submittedTo: payload.submittedTo } : {}),
    ...(payload.updatedAfter ? { updatedAfter: payload.updatedAfter } : {}),
  };
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
          query: {
            ...listQuery(payload),
            ...(payload.limit !== undefined ? { limit: payload.limit } : {}),
            ...(payload.offset !== undefined ? { offset: payload.offset } : {}),
          },
          ...(payload.headers ? { headers: payload.headers } : {}),
        }),
      getDatasetCodebook: (payload: DatasetListRequest) =>
        $fetch<DatasetCodebookResult>(DATASET_ROUTES.getDatasetCodebook.path, {
          method: "GET",
          query: listQuery(payload),
          ...(payload.headers ? { headers: payload.headers } : {}),
        }),
      getLiveCodebook: (payload: LiveCodebookRequest) =>
        $fetch<Codebook>(DATASET_ROUTES.getLiveCodebook.path, {
          method: "GET",
          query: { formId: payload.formId },
          ...(payload.headers ? { headers: payload.headers } : {}),
        }),
    }),
  });
}
