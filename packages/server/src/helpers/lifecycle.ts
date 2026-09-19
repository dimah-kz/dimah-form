import type {
  FormSnapshot,
  MaybePromise,
  ResponseRecord,
} from "@dimah-form/core";

import { errors } from "@/errors";
import {
  isStoreConflictError,
  type ResponseStore,
  type StoreWriteOptions,
} from "@/store";

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

export async function writeResponse(
  store: Pick<ResponseStore, "save" | "get">,
  row: ResponseRecord,
  options?: StoreWriteOptions,
): Promise<ResponseRecord> {
  try {
    await store.save(row, options);
  } catch (error) {
    if (isStoreConflictError(error)) throw errors.staleUpdate();
    throw error;
  }
  return persistedResponse((id) => store.get(id), row);
}

export async function writeForm(
  store: Pick<ResponseStore, "saveForm">,
  form: FormSnapshot,
  options?: StoreWriteOptions,
): Promise<FormSnapshot> {
  try {
    await store.saveForm(form, options);
  } catch (error) {
    if (isStoreConflictError(error)) throw errors.staleUpdate();
    throw error;
  }
  return form;
}
