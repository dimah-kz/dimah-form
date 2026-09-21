import {
  LIST_MAX_LIMIT,
  pageFromOverfetch,
  type ResponseRecord,
} from "@dimah-form/core";

import type { ListResponsesStoreQuery, ResponseStore } from "@/store";

/** Default cap for full-table walks (insights summary, historical codebook). */
export const DEFAULT_WALK_MAX_ROWS = 10_000;

export type WalkFullResponsesResult = {
  scanned: number;
  truncated: boolean;
};

export type WalkFullResponsesOptions = {
  signal?: AbortSignal;
  /** Stop after this many full rows. Omit for no cap. */
  maxRows?: number;
  visit: (row: ResponseRecord) => void | Promise<void>;
};

function isFullRecord(row: { definition?: unknown }): row is ResponseRecord {
  return "definition" in row && row.definition != null;
}

/**
 * Page `listResponses({ include: "full" })` and visit each full row.
 * Honors `AbortSignal`. `maxRows` sets `truncated` when more matching rows
 * remain.
 */
export async function walkFullResponses(
  listResponses: ResponseStore["listResponses"],
  filter: ListResponsesStoreQuery,
  options: WalkFullResponsesOptions,
): Promise<WalkFullResponsesResult> {
  const maxRows = options.maxRows;
  let scanned = 0;
  let truncated = false;
  let offset = 0;
  const limit = LIST_MAX_LIMIT;
  for (;;) {
    options.signal?.throwIfAborted();
    if (maxRows != null && scanned >= maxRows) {
      truncated = true;
      break;
    }
    const rows = await listResponses({
      ...filter,
      include: "full",
      limit: limit + 1,
      offset,
    });
    const page = pageFromOverfetch(rows, limit, offset);
    for (const row of page.items) {
      if (maxRows != null && scanned >= maxRows) {
        truncated = true;
        break;
      }
      if (!isFullRecord(row)) continue;
      await options.visit(row);
      scanned += 1;
    }
    if (truncated) break;
    if (page.nextOffset == null) break;
    if (maxRows != null && scanned >= maxRows) {
      truncated = true;
      break;
    }
    offset = page.nextOffset;
  }
  return { scanned, truncated };
}
