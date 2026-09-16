import type { FormSnapshot, ResponseRecord } from "@dimah-form/core";

export type ResponseStore = {
  getForm: (
    id: string,
  ) => FormSnapshot | undefined | Promise<FormSnapshot | undefined>;
  saveForm: (form: FormSnapshot) => void | Promise<void>;
  listForms: () => FormSnapshot[] | Promise<FormSnapshot[]>;
  create: (row: ResponseRecord) => void | Promise<void>;
  get: (
    id: string,
  ) => ResponseRecord | undefined | Promise<ResponseRecord | undefined>;
  save: (row: ResponseRecord) => void | Promise<void>;
  listResponses: (query?: {
    formId?: string;
  }) => ResponseRecord[] | Promise<ResponseRecord[]>;
};

function clone<T>(value: T): T {
  return structuredClone(value);
}

/**
 * In-memory `database` adapter for tests and local demos.
 * Isolated across `memoryAdapter()` calls.
 */
export function memoryAdapter(): ResponseStore {
  const forms = new Map<string, FormSnapshot>();
  const rows = new Map<string, ResponseRecord>();

  function insertFormIfMissing(row: ResponseRecord) {
    if (!forms.has(row.formId)) {
      forms.set(row.formId, clone(row.definition));
    }
  }

  return {
    getForm(id) {
      const form = forms.get(id);
      return form ? clone(form) : undefined;
    },
    saveForm(form) {
      forms.set(form.id, clone(form));
    },
    listForms() {
      return [...forms.values()].map(clone);
    },
    create(row) {
      insertFormIfMissing(row);
      rows.set(row.id, clone(row));
    },
    get(id) {
      const row = rows.get(id);
      return row ? clone(row) : undefined;
    },
    save(row) {
      rows.set(row.id, clone(row));
    },
    listResponses(query) {
      return [...rows.values()]
        .filter((row) => !query?.formId || row.formId === query.formId)
        .map(clone);
    },
  };
}
