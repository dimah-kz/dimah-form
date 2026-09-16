import type { ResponseRecord } from "@dimah-form/core";

export type ResponseStore = {
  create: (row: ResponseRecord) => void;
  get: (id: string) => ResponseRecord | undefined;
  save: (row: ResponseRecord) => void;
};

/** Per-instance in-memory responses. Isolated across `dimahForm()` calls. */
export function createMemoryResponseStore(): ResponseStore {
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
