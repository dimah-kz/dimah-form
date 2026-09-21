import type { InferFumaDB } from "fumadb";
import type { FormSnapshot, ResponseRecord } from "@dimah-form/core";
import {
  StoreConflictError,
  type ListResponsesStoreQuery,
  type ResponseStore,
  type StoreWriteOptions,
} from "@dimah-form/server";

import { v1, type DimahFormDB } from "@/fuma-db";
import {
  toFormSnapshot,
  toQuestionnaireColumns,
  toResponseColumns,
  toResponseRecord,
  toResponseSummaryFromRow,
} from "./map-row";

/** FumaDB client for the @dimah-form/db schema. */
export type DimahFormDbClient = InferFumaDB<typeof DimahFormDB>;

const RESPONSE_SUMMARY_COLUMNS = [
  "id",
  "questionnaireId",
  "status",
  "respondentId",
  "submittedAt",
  "createdAt",
  "updatedAt",
] as const;

function jsonEqual(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) return true;
  if (left === null || right === null) return false;
  if (typeof left !== typeof right) return false;
  if (Array.isArray(left)) {
    if (!Array.isArray(right) || left.length !== right.length) return false;
    return left.every((item, index) => jsonEqual(item, right[index]));
  }
  if (typeof left === "object" && typeof right === "object") {
    const leftRecord = left as Record<string, unknown>;
    const rightRecord = right as Record<string, unknown>;
    const keys = Object.keys(leftRecord);
    if (keys.length !== Object.keys(rightRecord).length) return false;
    return keys.every(
      (key) =>
        Object.hasOwn(rightRecord, key) &&
        jsonEqual(leftRecord[key], rightRecord[key]),
    );
  }
  return false;
}

/** SQLite integer seconds can round `updatedAt` / `submittedAt`. */
function sameTimestamp(left: string, right: string) {
  const a = Date.parse(left);
  const b = Date.parse(right);
  if (Number.isNaN(a) || Number.isNaN(b)) return left === right;
  return Math.abs(a - b) < 1000;
}

function sameOptionalTimestamp(
  left: string | null | undefined,
  right: string | null | undefined,
) {
  if (left == null && right == null) return true;
  if (left == null || right == null) return false;
  return sameTimestamp(left, right);
}

function sameResponseWrite(mapped: ResponseRecord, row: ResponseRecord) {
  return (
    mapped.status === row.status &&
    mapped.respondentId === row.respondentId &&
    sameOptionalTimestamp(mapped.submittedAt, row.submittedAt) &&
    sameTimestamp(mapped.updatedAt, row.updatedAt) &&
    jsonEqual(mapped.answers, row.answers) &&
    jsonEqual(mapped.definition, row.definition)
  );
}

function sameFormWrite(mapped: FormSnapshot, form: FormSnapshot) {
  return (
    mapped.title === form.title &&
    mapped.status === form.status &&
    mapped.slug === form.slug &&
    mapped.description === form.description &&
    (form.updatedAt === undefined ||
      sameOptionalTimestamp(mapped.updatedAt, form.updatedAt)) &&
    jsonEqual(mapped.fields, form.fields) &&
    jsonEqual(mapped.meta, form.meta)
  );
}

function listResponseWhere<T>(
  query: ListResponsesStoreQuery,
  b: {
    (
      col:
        | "questionnaireId"
        | "respondentId"
        | "status"
        | "submittedAt"
        | "updatedAt",
      op: "=" | ">=" | "<=" | ">",
      value: string | Date,
    ): T;
    and: (...parts: T[]) => T;
  },
): T {
  const parts: T[] = [];
  if (query.formId) parts.push(b("questionnaireId", "=", query.formId));
  if (query.respondentId) {
    parts.push(b("respondentId", "=", query.respondentId));
  }
  if (query.status) parts.push(b("status", "=", query.status));
  if (query.submittedFrom) {
    parts.push(b("submittedAt", ">=", new Date(query.submittedFrom)));
  }
  if (query.submittedTo) {
    parts.push(b("submittedAt", "<=", new Date(query.submittedTo)));
  }
  if (query.updatedAfter) {
    parts.push(b("updatedAt", ">", new Date(query.updatedAfter)));
  }
  const first = parts[0];
  if (first !== undefined && parts.length === 1) return first;
  return b.and(...parts);
}

function hasListResponseFilters(query?: ListResponsesStoreQuery) {
  return Boolean(
    query?.formId ||
    query?.status ||
    query?.respondentId ||
    query?.submittedFrom ||
    query?.submittedTo ||
    query?.updatedAfter,
  );
}

/** Persist questionnaires and responses. Start never overwrites a live form. */
export function createDbResponseStore(db: DimahFormDbClient): ResponseStore {
  const orm = db.orm(v1.version);

  async function upsertResponse(
    row: ResponseRecord,
    options?: StoreWriteOptions,
  ) {
    const columns = toResponseColumns(row);
    const { id: _id, createdAt: _createdAt, ...update } = columns;
    if (options?.expectedUpdatedAt !== undefined) {
      const expected = new Date(options.expectedUpdatedAt);
      await orm.updateMany("response", {
        set: update,
        where: (b) =>
          b.and(b("id", "=", row.id), b("updatedAt", "=", expected)),
      });
      const fresh = await orm.findFirst("response", {
        where: (b) => b("id", "=", row.id),
      });
      if (!fresh) throw new StoreConflictError();
      if (!sameResponseWrite(toResponseRecord(fresh), row)) {
        throw new StoreConflictError();
      }
      return;
    }
    await orm
      .upsert("response", {
        where: (b) => b("id", "=", row.id),
        update,
        create: columns,
      })
      .forceReturning();
  }

  async function insertQuestionnaireIfMissing(row: ResponseRecord) {
    const existing = await orm.findFirst("questionnaire", {
      where: (b) => b("id", "=", row.formId),
    });
    if (existing) return;
    const columns = toQuestionnaireColumns(
      row.definition,
      new Date(row.updatedAt),
    );
    await orm.create("questionnaire", {
      ...columns,
      createdAt: new Date(row.createdAt),
    });
  }

  async function upsertLiveForm(
    form: FormSnapshot,
    options?: StoreWriteOptions,
  ) {
    const now = form.updatedAt ? new Date(form.updatedAt) : new Date();
    const createdAt = form.createdAt ? new Date(form.createdAt) : now;
    const columns = toQuestionnaireColumns(form, now);
    const { id: _id, ...update } = columns;
    if (options?.expectedUpdatedAt !== undefined) {
      const expected = new Date(options.expectedUpdatedAt);
      await orm.updateMany("questionnaire", {
        set: update,
        where: (b) =>
          b.and(b("id", "=", form.id), b("updatedAt", "=", expected)),
      });
      const fresh = await orm.findFirst("questionnaire", {
        where: (b) => b("id", "=", form.id),
      });
      if (!fresh) throw new StoreConflictError();
      if (!sameFormWrite(toFormSnapshot(fresh), form)) {
        throw new StoreConflictError();
      }
      return;
    }
    await orm
      .upsert("questionnaire", {
        where: (b) => b("id", "=", form.id),
        update,
        create: {
          ...columns,
          createdAt,
        },
      })
      .forceReturning();
  }

  return {
    async getForm(idOrSlug) {
      const byId = await orm.findFirst("questionnaire", {
        where: (b) => b("id", "=", idOrSlug),
      });
      if (byId) return toFormSnapshot(byId);
      const bySlug = await orm.findFirst("questionnaire", {
        where: (b) => b("slug", "=", idOrSlug),
      });
      return bySlug ? toFormSnapshot(bySlug) : undefined;
    },
    async saveForm(form, options) {
      await upsertLiveForm(form, options);
    },
    async deleteForm(id) {
      await orm.deleteMany("questionnaire", {
        where: (b) => b("id", "=", id),
      });
    },
    async listForms(query) {
      const status = query?.status;
      const rows = await orm.findMany("questionnaire", {
        where: status ? (b) => b("status", "=", status) : undefined,
        orderBy: ["updatedAt", "desc"],
        limit: query?.limit,
        offset: query?.offset,
      });
      const forms: FormSnapshot[] = [];
      for (const row of rows) {
        try {
          forms.push(toFormSnapshot(row));
        } catch {
          continue;
        }
      }
      return forms;
    },
    async createResponse(row) {
      await insertQuestionnaireIfMissing(row);
      await upsertResponse(row);
    },
    async getResponse(id) {
      const row = await orm.findFirst("response", {
        where: (b) => b("id", "=", id),
      });
      return row ? toResponseRecord(row) : undefined;
    },
    async saveResponse(row, options) {
      await upsertResponse(row, options);
    },
    async deleteResponse(id) {
      await orm.deleteMany("response", {
        where: (b) => b("id", "=", id),
      });
    },
    async listResponses(query) {
      const include = query?.include === "summary" ? "summary" : "full";
      const hasFilters = hasListResponseFilters(query);
      if (include === "summary") {
        const rows = await orm.findMany("response", {
          select: [...RESPONSE_SUMMARY_COLUMNS],
          where:
            hasFilters && query
              ? (b) => listResponseWhere(query, b)
              : undefined,
          orderBy: ["updatedAt", "desc"],
          limit: query?.limit,
          offset: query?.offset,
        });
        return rows.map((row) => toResponseSummaryFromRow(row));
      }
      const rows = await orm.findMany("response", {
        where:
          hasFilters && query ? (b) => listResponseWhere(query, b) : undefined,
        orderBy: ["updatedAt", "desc"],
        limit: query?.limit,
        offset: query?.offset,
      });
      return rows.map((row) => toResponseRecord(row));
    },
    async countResponses(query) {
      const hasFilters = hasListResponseFilters(query);
      const rows = await orm.findMany("response", {
        select: ["id"],
        where:
          hasFilters && query ? (b) => listResponseWhere(query, b) : undefined,
      });
      return rows.length;
    },
    async findLatestDraft(query) {
      const rows = await orm.findMany("response", {
        where: (b) =>
          b.and(
            b("questionnaireId", "=", query.formId),
            b("respondentId", "=", query.respondentId),
            b("status", "=", "draft"),
          ),
        orderBy: ["updatedAt", "desc"],
        limit: 1,
      });
      return rows[0] ? toResponseRecord(rows[0]) : undefined;
    },
    async getOrCreateDraft(row) {
      const respondentId = row.respondentId;
      if (respondentId == null || respondentId === "") {
        throw new Error("getOrCreateDraft requires respondentId");
      }
      const existing = await orm.findMany("response", {
        where: (b) =>
          b.and(
            b("questionnaireId", "=", row.formId),
            b("respondentId", "=", respondentId),
            b("status", "=", "draft"),
          ),
        orderBy: ["updatedAt", "desc"],
        limit: 1,
      });
      if (existing[0]) {
        return { row: toResponseRecord(existing[0]), created: false };
      }
      await insertQuestionnaireIfMissing(row);
      await upsertResponse(row);
      const drafts = await orm.findMany("response", {
        where: (b) =>
          b.and(
            b("questionnaireId", "=", row.formId),
            b("respondentId", "=", respondentId),
            b("status", "=", "draft"),
          ),
      });
      const sorted = drafts
        .map((item) => toResponseRecord(item))
        .toSorted(
          (a, b) =>
            a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id),
        );
      const winner = sorted[0];
      if (winner && winner.id !== row.id) {
        await orm.deleteMany("response", {
          where: (b) => b("id", "=", row.id),
        });
        return { row: winner, created: false };
      }
      const persisted = await orm.findFirst("response", {
        where: (b) => b("id", "=", row.id),
      });
      return {
        row: persisted ? toResponseRecord(persisted) : row,
        created: true,
      };
    },
  };
}
