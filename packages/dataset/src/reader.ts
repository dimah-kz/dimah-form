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

export type DatasetCodebookFn = () => Promise<{
  codebook: Codebook;
  total: number;
  truncated?: boolean;
}>;

export type DatasetReaderResult = {
  spec: typeof DATASET_SPEC;
  records: DatasetRecord[];
  codebook: Codebook;
  total: number;
};

export type CreateDatasetReaderOptions = {
  page: DatasetPageFn;
  /**
   * Historical codebook for the same filter (`getDatasetCodebook`).
   * When set, {@link createDatasetReader}'s `readCodebook` does not walk
   * record pages.
   */
  codebook?: DatasetCodebookFn;
  signal?: AbortSignal;
  limit?: number;
};

/**
 * Walk paged `getDatasetPage` results. `records()` yields page-by-page
 * (does not buffer the whole dataset). CSV columns need a complete
 * codebook first — call `getDatasetCodebook` or `readCodebook()`, then
 * encode with `createCsvEncoder`.
 */
export function createDatasetReader(options: CreateDatasetReaderOptions) {
  async function* pages(): AsyncGenerator<DatasetPage> {
    let offset = 0;
    for (;;) {
      options.signal?.throwIfAborted();
      const page = await options.page({
        ...(options.limit !== undefined ? { limit: options.limit } : {}),
        offset,
      });
      yield page;
      if (page.nextOffset == null) break;
      offset = page.nextOffset;
    }
  }

  async function readAll(): Promise<DatasetReaderResult> {
    const records: DatasetRecord[] = [];
    let codebook = emptyCodebook();
    let total = 0;
    for await (const page of pages()) {
      records.push(...page.records);
      codebook = mergeCodebooks(codebook, page.codebook);
      total = page.total;
    }
    return { spec: DATASET_SPEC, records, codebook, total };
  }

  async function readCodebook(): Promise<{
    codebook: Codebook;
    total: number;
  }> {
    if (options.codebook) {
      options.signal?.throwIfAborted();
      const history = await options.codebook();
      return { codebook: history.codebook, total: history.total };
    }
    let codebook = emptyCodebook();
    let total = 0;
    for await (const page of pages()) {
      codebook = mergeCodebooks(codebook, page.codebook);
      total = page.total;
    }
    return { codebook, total };
  }

  async function* records(): AsyncGenerator<DatasetRecord> {
    for await (const page of pages()) {
      for (const record of page.records) yield record;
    }
  }

  return { readAll, readCodebook, records, pages };
}
