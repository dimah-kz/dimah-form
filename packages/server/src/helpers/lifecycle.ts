import type { ResponseRecord } from "@dimah-form/core";

import type { MaybePromise } from "@/types";

/** Run `on*` then persist, then `after*`. If persist throws, `after*` is skipped. */
export async function commitLifecycle<T>(
  before: (() => MaybePromise<void>) | undefined,
  persist: () => MaybePromise<T>,
  after: (() => MaybePromise<void>) | undefined,
): Promise<T> {
  await before?.();
  const result = await persist();
  await after?.();
  return result;
}

/**
 * Adapters may round timestamps (SQLite integer seconds). Re-read so the
 * client concurrency token matches the next `get()`.
 */
export async function persistedResponse(
  get: (id: string) => MaybePromise<ResponseRecord | undefined>,
  row: ResponseRecord,
): Promise<ResponseRecord> {
  return (await get(row.id)) ?? row;
}
