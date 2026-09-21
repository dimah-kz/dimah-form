import { emptyCodebook, mergeCodebooks } from "./codebook";
import {
  DATASET_SPEC,
  type Codebook,
  type DatasetPage,
  type DatasetRecord,
} from "./spec";

export type DatasetPageQuery = {
  limit?: number;
  offset?: number;
};

export type DatasetPageFn = (query: DatasetPageQuery) => Promise<DatasetPage>;

export type DatasetReaderResult = {
  spec: typeof DATASET_SPEC;
  records: DatasetRecord[];
  codebook: Codebook;
};

export type CreateDatasetReaderOptions = {
  page: DatasetPageFn;
  signal?: AbortSignal;
  limit?: number;
};

/**
 * Walk paged `getDatasetPage` results and merge page codebooks into one
 * historical codebook. Same helper for server jobs and download routes.
 */
export function createDatasetReader(options: CreateDatasetReaderOptions) {
  async function readAll(): Promise<DatasetReaderResult> {
    const records: DatasetRecord[] = [];
    let codebook = emptyCodebook();
    let offset = 0;
    for (;;) {
      options.signal?.throwIfAborted();
      const page = await options.page({
        ...(options.limit !== undefined ? { limit: options.limit } : {}),
        offset,
      });
      records.push(...page.records);
      codebook = mergeCodebooks(codebook, page.codebook);
      if (page.nextOffset == null) break;
      offset = page.nextOffset;
    }
    return { spec: DATASET_SPEC, records, codebook };
  }

  async function* records(): AsyncGenerator<DatasetRecord> {
    const { records: all } = await readAll();
    for (const record of all) yield record;
  }

  return { readAll, records };
}
