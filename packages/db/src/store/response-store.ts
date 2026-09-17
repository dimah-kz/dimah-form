import type { InferFumaDB } from "fumadb";
import type { FormSnapshot, ResponseRecord } from "@dimah-form/core";
import type { ResponseStore } from "@dimah-form/server";

import { DimahFormDB, v1 } from "@/fuma-db";
import {
  toFormSnapshot,
  toQuestionnaireColumns,
  toResponseColumns,
  toResponseRecord,
} from "./map-row";

/** FumaDB client for the @dimah-form/db schema. */
export type DimahFormDbClient = InferFumaDB<typeof DimahFormDB>;

/** Persist questionnaires and responses. Start never overwrites a live form. */
export function createDbResponseStore(db: DimahFormDbClient): ResponseStore {
  const orm = db.orm(v1.version);

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
    const now = form.updatedAt ? new Date(form.updatedAt) : new Date();
    const createdAt = form.createdAt ? new Date(form.createdAt) : now;
    const columns = toQuestionnaireColumns(form, now);
    const { id: _id, ...update } = columns;
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
    async saveForm(form) {
      await upsertLiveForm(form);
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
    async delete(id) {
      await orm.deleteMany("response", {
        where: (b) => b("id", "=", id),
      });
    },
    async listResponses(query) {
      const formId = query?.formId;
      const respondentId = query?.respondentId;
      const status = query?.status;
      const rows = await orm.findMany("response", {
        where:
          formId || respondentId || status
            ? (b) => {
                const parts = [
                  ...(formId ? [b("questionnaireId", "=", formId)] : []),
                  ...(respondentId
                    ? [b("respondentId", "=", respondentId)]
                    : []),
                  ...(status ? [b("status", "=", status)] : []),
                ];
                return parts.length === 1 ? parts[0] : b.and(...parts);
              }
            : undefined,
        orderBy: ["updatedAt", "desc"],
        limit: query?.limit,
        offset: query?.offset,
      });
      return rows.map((row) => toResponseRecord(row));
    },
  };
}
