import type {
  FormSnapshot,
  FormStatus,
  ResponseRecord,
  ResponseStatus,
} from "@dimah-form/core";

export type ListFormsStoreQuery = {
  status?: FormStatus;
  limit?: number;
  offset?: number;
};

export type ListResponsesStoreQuery = {
  formId?: string;
  respondentId?: string;
  status?: ResponseStatus;
  limit?: number;
  offset?: number;
};

export type ResponseStore = {
  getForm: (
    idOrSlug: string,
  ) => FormSnapshot | undefined | Promise<FormSnapshot | undefined>;
  saveForm: (form: FormSnapshot) => void | Promise<void>;
  deleteForm: (id: string) => void | Promise<void>;
  listForms: (
    query?: ListFormsStoreQuery,
  ) => FormSnapshot[] | Promise<FormSnapshot[]>;
  create: (row: ResponseRecord) => void | Promise<void>;
  get: (
    id: string,
  ) => ResponseRecord | undefined | Promise<ResponseRecord | undefined>;
  save: (row: ResponseRecord) => void | Promise<void>;
  delete: (id: string) => void | Promise<void>;
  listResponses: (
    query?: ListResponsesStoreQuery,
  ) => ResponseRecord[] | Promise<ResponseRecord[]>;
};

function clone<T>(value: T): T {
  return structuredClone(value);
}

function sortByUpdatedAtDesc<T extends { updatedAt?: string }>(items: T[]) {
  return items.toSorted((a, b) =>
    (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""),
  );
}

function slicePage<T>(
  items: readonly T[],
  query?: { limit?: number; offset?: number },
) {
  if (query?.limit == null) return [...items];
  const offset = query.offset ?? 0;
  return items.slice(offset, offset + query.limit);
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

  function findForm(idOrSlug: string) {
    const byId = forms.get(idOrSlug);
    if (byId) return clone(byId);
    for (const form of forms.values()) {
      if (form.slug === idOrSlug) return clone(form);
    }
    return undefined;
  }

  return {
    getForm(idOrSlug) {
      return findForm(idOrSlug);
    },
    saveForm(form) {
      const now = new Date().toISOString();
      const existing = forms.get(form.id);
      forms.set(
        form.id,
        clone({
          ...form,
          createdAt: form.createdAt ?? existing?.createdAt ?? now,
          updatedAt: form.updatedAt ?? now,
        }),
      );
    },
    deleteForm(id) {
      forms.delete(id);
    },
    listForms(query) {
      const filtered = sortByUpdatedAtDesc(
        forms
          .values()
          .filter((form) => !query?.status || form.status === query.status)
          .toArray(),
      );
      return slicePage(filtered, query).map(clone);
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
    delete(id) {
      rows.delete(id);
    },
    listResponses(query) {
      const filtered = sortByUpdatedAtDesc(
        rows
          .values()
          .filter((row) => {
            if (query?.formId && row.formId !== query.formId) return false;
            if (
              query?.respondentId &&
              row.respondentId !== query.respondentId
            ) {
              return false;
            }
            if (query?.status && row.status !== query.status) return false;
            return true;
          })
          .toArray(),
      );
      return slicePage(filtered, query).map(clone);
    },
  };
}
