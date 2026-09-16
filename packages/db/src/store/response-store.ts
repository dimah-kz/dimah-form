import type { InferFumaDB } from "fumadb";
import type { ResponseRecord } from "@dimah-form/core";
import type { ResponseStore } from "@dimah-form/server";

import { DimahFormDB } from "@/fuma-db";
import {
  toQuestionnaireColumns,
  toResponseColumns,
  toResponseRecord,
} from "./map-row";

/** FumaDB client for the @dimah-form/db schema. */
export type DimahFormDbClient = InferFumaDB<typeof DimahFormDB>;

function isResponseStore(value: unknown): value is ResponseStore {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as ResponseStore).create === "function" &&
    typeof (value as ResponseStore).get === "function" &&
    typeof (value as ResponseStore).save === "function"
  );
}

export function resolveResponseStore(
  client: DimahFormDbClient | ResponseStore,
): ResponseStore {
  return isResponseStore(client) ? client : createDbResponseStore(client);
}

/** Persist responses. Inserts the parent questionnaire only if it is missing. */
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
    const columns = toQuestionnaireColumns(row);
    await orm.create("questionnaire", {
      ...columns,
      createdAt: new Date(row.createdAt),
    });
  }

  return {
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
  };
}
