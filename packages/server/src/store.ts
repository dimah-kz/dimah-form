import {
  toResponseSummary,
  type FormSnapshot,
  type FormStatus,
  type ResponseRecord,
  type ResponseStatus,
  type ResponseSummary,
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
  /** Default `"full"`. `"summary"` omits `definition` / `answers`. */
  include?: "summary" | "full";
  limit?: number;
  offset?: number;
};

export type StoreWriteOptions = {
  /** When set, the write is a no-op / conflict unless the stored token matches. */
  expectedUpdatedAt?: string;
};

/** Adapter-level optimistic concurrency failure. Handlers map this to `STALE_UPDATE`. */
export class StoreConflictError extends Error {
  readonly code = "STALE_UPDATE";
  constructor(message = "The record was updated") {
    super(message);
    this.name = "StoreConflictError";
  }
}

export function isStoreConflictError(
  error: unknown,
): error is StoreConflictError {
  return (
    error instanceof StoreConflictError ||
    (error instanceof Error && error.name === "StoreConflictError")
  );
}

export type ResponseStore = {
  getForm: (
    idOrSlug: string,
  ) => FormSnapshot | undefined | Promise<FormSnapshot | undefined>;
  saveForm: (
    form: FormSnapshot,
    options?: StoreWriteOptions,
  ) => void | Promise<void>;
  deleteForm: (id: string) => void | Promise<void>;
  listForms: (
    query?: ListFormsStoreQuery,
  ) => FormSnapshot[] | Promise<FormSnapshot[]>;
  create: (row: ResponseRecord) => void | Promise<void>;
  get: (
    id: string,
  ) => ResponseRecord | undefined | Promise<ResponseRecord | undefined>;
  save: (
    row: ResponseRecord,
    options?: StoreWriteOptions,
  ) => void | Promise<void>;
  delete: (id: string) => void | Promise<void>;
  listResponses: (
    query?: ListResponsesStoreQuery,
  ) =>
    | (ResponseRecord | ResponseSummary)[]
    | Promise<(ResponseRecord | ResponseSummary)[]>;
  findLatestDraft: (query: {
    formId: string;
    respondentId: string;
  }) => ResponseRecord | undefined | Promise<ResponseRecord | undefined>;
  /**
   * Insert `row` when no draft exists for this form + respondent.
   * Concurrent creates keep the oldest row and drop the loser.
   */
  getOrCreateDraft: (
    row: ResponseRecord,
  ) =>
    | { row: ResponseRecord; created: boolean }
    | Promise<{ row: ResponseRecord; created: boolean }>;
};

function clone<T>(value: T): T {
  return structuredClone(value);
}

function sortByUpdatedAtDesc<T extends { updatedAt?: string }>(items: T[]) {
  return items.toSorted((a, b) =>
    (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""),
  );
}

function sortDraftsOldestFirst(items: ResponseRecord[]) {
  return items.toSorted(
    (a, b) =>
      a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id),
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

function assertFreshToken(
  existing: { updatedAt?: string } | undefined,
  expected: string | undefined,
) {
  if (expected === undefined) return;
  if (!existing || existing.updatedAt !== expected) {
    throw new StoreConflictError();
  }
}

function requireRespondentId(row: ResponseRecord) {
  if (row.respondentId == null || row.respondentId === "") {
    throw new Error("getOrCreateDraft requires respondentId");
  }
  return row.respondentId;
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

  function matchingResponses(query?: ListResponsesStoreQuery) {
    return sortByUpdatedAtDesc(
      rows
        .values()
        .filter((row) => {
          if (query?.formId && row.formId !== query.formId) return false;
          if (query?.respondentId && row.respondentId !== query.respondentId) {
            return false;
          }
          if (query?.status && row.status !== query.status) return false;
          return true;
        })
        .toArray(),
    );
  }

  function draftsFor(formId: string, respondentId: string) {
    return sortDraftsOldestFirst(
      rows
        .values()
        .filter(
          (row) =>
            row.formId === formId &&
            row.respondentId === respondentId &&
            row.status === "draft",
        )
        .toArray(),
    );
  }

  return {
    getForm(idOrSlug) {
      return findForm(idOrSlug);
    },
    saveForm(form, options) {
      const existing = forms.get(form.id);
      assertFreshToken(existing, options?.expectedUpdatedAt);
      const now = new Date().toISOString();
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
    save(row, options) {
      const existing = rows.get(row.id);
      assertFreshToken(existing, options?.expectedUpdatedAt);
      rows.set(row.id, clone(row));
    },
    delete(id) {
      rows.delete(id);
    },
    listResponses(query) {
      const page = slicePage(matchingResponses(query), query).map(clone);
      if (query?.include === "summary") {
        return page.map(toResponseSummary);
      }
      return page;
    },
    findLatestDraft(query) {
      const open = matchingResponses({
        formId: query.formId,
        respondentId: query.respondentId,
        status: "draft",
      });
      return open[0] ? clone(open[0]) : undefined;
    },
    getOrCreateDraft(row) {
      const respondentId = requireRespondentId(row);
      const existing = matchingResponses({
        formId: row.formId,
        respondentId,
        status: "draft",
      })[0];
      if (existing) return { row: clone(existing), created: false };
      insertFormIfMissing(row);
      rows.set(row.id, clone(row));
      const drafts = draftsFor(row.formId, respondentId);
      const winner = drafts[0];
      if (winner && winner.id !== row.id) {
        rows.delete(row.id);
        return { row: clone(winner), created: false };
      }
      return { row: clone(row), created: true };
    },
  };
}
