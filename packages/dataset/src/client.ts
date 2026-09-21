import { defineClientPlugin } from "@dimah-form/core";

import { DATASET_ID } from "./errors";
import { DATASET_ROUTES } from "./routes";
import type { Codebook, DatasetPage } from "./spec";

export {
  DATASET_SPEC,
  codebookSchema,
  datasetPageQuerySchema,
  datasetPageSchema,
  datasetRecordSchema,
  emptyCodebook,
  liveCodebookQuerySchema,
  sortDatasetIds,
  type Codebook,
  type CodebookField,
  type CodebookOption,
  type CodebookScores,
  type CodebookSnapshot,
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
  datasetCsvColumns,
  toCsv,
  toCsvLabels,
  toDataPackage,
  toJsonl,
  type DataPackageFiles,
  type EncodeOptions,
} from "./encode";
export {
  createDatasetReader,
  type CreateDatasetReaderOptions,
  type DatasetPageFn,
  type DatasetPageQuery,
  type DatasetReaderResult,
} from "./reader";
export { DATASET_ID } from "./errors";
export { DATASET_ROUTES } from "./routes";

export type DatasetPageRequest = {
  formId: string;
  status?: "draft" | "submitted" | "abandoned";
  limit?: number;
  offset?: number;
  headers?: HeadersInit;
};

export type LiveCodebookRequest = {
  formId: string;
  headers?: HeadersInit;
};

/**
 * Browser companion. Same id `"dataset"`. Full-file downloads belong on a
 * consumer route — this only pages `getDatasetPage`.
 */
export function datasetClientPlugin() {
  return defineClientPlugin({
    id: DATASET_ID,
    endpoints: ({ $fetch }) => ({
      getDatasetPage: (payload: DatasetPageRequest) =>
        $fetch<DatasetPage>(DATASET_ROUTES.getDatasetPage.path, {
          method: "GET",
          query: {
            formId: payload.formId,
            ...(payload.status ? { status: payload.status } : {}),
            ...(payload.limit !== undefined ? { limit: payload.limit } : {}),
            ...(payload.offset !== undefined ? { offset: payload.offset } : {}),
          },
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
