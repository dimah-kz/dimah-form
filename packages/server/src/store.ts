import type { ResponseRecord } from "@dimah-form/core";

export type ResponseStore = {
  create: (row: ResponseRecord) => void | Promise<void>;
  get: (
    id: string,
  ) => ResponseRecord | undefined | Promise<ResponseRecord | undefined>;
  save: (row: ResponseRecord) => void | Promise<void>;
};

/**
 * In-memory `database` adapter for tests and local demos.
 * Isolated across `memoryAdapter()` calls.
 */
export function memoryAdapter(): ResponseStore {
  const rows = new Map<string, ResponseRecord>();
  return {
    create(row) {
      rows.set(row.id, structuredClone(row));
    },
    get(id) {
      const row = rows.get(id);
      return row ? structuredClone(row) : undefined;
    },
    save(row) {
      rows.set(row.id, structuredClone(row));
    },
  };
}
