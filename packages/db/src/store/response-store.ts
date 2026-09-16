import type { InferFumaDB } from "fumadb";
import type { FormSnapshot, ResponseRecord } from "@dimah-form/core";
import type { ResponseStore } from "@dimah-form/server";

import { DimahFormDB } from "@/fuma-db";
import {
  toFormSnapshot,
  toQuestionnaireColumns,
  toResponseColumns,
  toResponseRecord,
} from "./map-row";

/** FumaDB client for the @dimah-form/db schema. */
export type DimahFormDbClient = InferFumaDB<typeof DimahFormDB>;

const STORE_METHODS = [
  "create",
  "get",
  "save",
  "getForm",
  "saveForm",
  "listForms",
  "listResponses",
] as const satisfies readonly (keyof ResponseStore)[];

function isResponseStore(value: unknown): value is ResponseStore {
  if (typeof value !== "object" || value === null) return false;
  const store = value as ResponseStore;
  return STORE_METHODS.every((method) => typeof store[method] === "function");
}

export function resolveResponseStore(
  client: DimahFormDbClient | ResponseStore,
): ResponseStore {
  return isResponseStore(client) ? client : createDbResponseStore(client);
}

/** Persist questionnaires and responses. Start never overwrites a live form. */
export function createDbResponseStore(db: DimahFormDbClient): ResponseStore {
  const orm = db.orm("1.0.0");

  async function upsertResponse(row: ResponseRecord) {
    const columns = toResponseColumns(row);
    const { id: _id, ...update } = columns;
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

  async function upsertLiveForm(form: FormSnapshot) {
    const now = new Date();
    const columns = toQuestionnaireColumns(form, now);
    const { id: _id, ...update } = columns;
    await orm
      .upsert("questionnaire", {
        where: (b) => b("id", "=", form.id),
        update,
        create: {
          ...columns,
          createdAt: now,
        },
      })
      .forceReturning();
  }

  return {
    async getForm(id) {
      const row = await orm.findFirst("questionnaire", {
        where: (b) => b("id", "=", id),
      });
      return row ? toFormSnapshot(row) : undefined;
    },
    async saveForm(form) {
      await upsertLiveForm(form);
    },
    async listForms() {
      const rows = await orm.findMany("questionnaire", {
        orderBy: ["updatedAt", "desc"],
      });
      return rows.map((row) => toFormSnapshot(row));
    },
    async create(row) {
      await insertQuestionnaireIfMissing(row);
      await upsertResponse(row);
    },
    async get(id) {
      const row = await orm.findFirst("response", {
        where: (b) => b("id", "=", id),
      });
      return row ? toResponseRecord(row) : undefined;
    },
    async save(row) {
      await upsertResponse(row);
    },
    async listResponses(query) {
      const formId = query?.formId;
      const rows = formId
        ? await orm.findMany("response", {
            where: (b) => b("questionnaireId", "=", formId),
            orderBy: ["updatedAt", "desc"],
          })
        : await orm.findMany("response", {
            orderBy: ["updatedAt", "desc"],
          });
      return rows.map((row) => toResponseRecord(row));
    },
  };
}
