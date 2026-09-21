import {
  formDefinitionSchema,
  normalizeFormSnapshot,
  normalizeListPage,
  pageFromOverfetch,
  type FieldTypeDefinition,
  type FormSnapshot,
  type ResponseRecord,
} from "@dimah-form/core";
import {
  createFormEndpoint,
  definePlugin,
  errors,
  getPluginContext,
} from "@dimah-form/server";
import { hasScoringMeta, scoreResponse } from "@dimah-form/scoring";

import { buildCodebook, liveCodebook } from "./codebook";
import { DATASET_ID } from "./errors";
import { snapshotKey, type SnapshotKeyCache } from "./hash";
import { projectResponse } from "./project";
import { DATASET_ROUTES } from "./routes";
import {
  DATASET_SPEC,
  codebookSchema,
  datasetPageQuerySchema,
  datasetPageSchema,
  liveCodebookQuerySchema,
  type DatasetPage,
} from "./spec";

type DatasetPluginContext = {
  fieldTypes: ReadonlyMap<string, FieldTypeDefinition>;
};

function isFullRecord(row: { definition?: unknown }): row is ResponseRecord {
  return "definition" in row && row.definition != null;
}

function catalogSnapshot(
  forms: Record<string, unknown>,
  formId: string,
): FormSnapshot | undefined {
  if (Object.hasOwn(forms, formId)) {
    const parsed = formDefinitionSchema.safeParse(forms[formId]);
    if (parsed.success) {
      return normalizeFormSnapshot({ id: formId, ...parsed.data });
    }
  }
  for (const [id, definition] of Object.entries(forms)) {
    const parsed = formDefinitionSchema.safeParse(definition);
    if (!parsed.success) continue;
    const snapshot = normalizeFormSnapshot({ id, ...parsed.data });
    if (snapshot.slug === formId) return snapshot;
  }
  return undefined;
}

async function requireForm(
  forms: Record<string, unknown>,
  getForm: (
    idOrSlug: string,
  ) => FormSnapshot | undefined | Promise<FormSnapshot | undefined>,
  formId: string,
): Promise<FormSnapshot> {
  const fromCatalog = catalogSnapshot(forms, formId);
  if (fromCatalog) return fromCatalog;
  const stored = await getForm(formId);
  if (stored) return stored;
  throw errors.unknownForm(formId);
}

function fieldTypesOf(config: {
  pluginContext: ReadonlyMap<string, unknown>;
}): ReadonlyMap<string, FieldTypeDefinition> | undefined {
  return getPluginContext<DatasetPluginContext>(config, DATASET_ID)?.fieldTypes;
}

/**
 * Official dataset plugin. Compute-on-read JSONL + codebook pages.
 * Does not add tables or a `meta` namespace. Full-file zip stays in the app.
 */
export function datasetPlugin() {
  return definePlugin({
    id: DATASET_ID,
    init(ctx) {
      return { context: { fieldTypes: ctx.fieldTypes } };
    },
    endpoints: {
      getDatasetPage: createFormEndpoint(
        DATASET_ROUTES.getDatasetPage.path,
        {
          method: DATASET_ROUTES.getDatasetPage.method,
          query: datasetPageQuerySchema,
          output: datasetPageSchema,
        },
        async (ctx): Promise<DatasetPage> => {
          const config = ctx.context.config;
          const form = await requireForm(
            config.forms,
            (id) => config.database.getForm(id),
            ctx.query.formId,
          );
          const { limit, offset } = normalizeListPage(ctx.query);
          const rows = await config.database.listResponses({
            formId: form.id,
            status: ctx.query.status ?? "submitted",
            include: "full",
            limit: limit + 1,
            offset,
          });
          const page = pageFromOverfetch(rows, limit, offset);
          const cache: SnapshotKeyCache = new Map();
          const fieldTypes = fieldTypesOf(config);
          const records = [];
          const sources = [];
          for (const row of page.items) {
            if (!isFullRecord(row)) continue;
            const key = await snapshotKey(row.definition, cache);
            const scores = hasScoringMeta(row.definition)
              ? scoreResponse(row.definition, row.answers)
              : undefined;
            records.push(
              await projectResponse(row, {
                fieldTypes,
                scores,
                includeRespondentId: true,
                snapshotKey: key,
                snapshotKeyCache: cache,
              }),
            );
            sources.push({
              snapshotKey: key,
              definition: row.definition,
              seenAt: row.submittedAt ?? row.createdAt,
            });
          }
          return {
            spec: DATASET_SPEC,
            records,
            codebook: buildCodebook(sources),
            limit,
            offset,
            nextOffset: page.nextOffset,
          };
        },
      ),
      getLiveCodebook: createFormEndpoint(
        DATASET_ROUTES.getLiveCodebook.path,
        {
          method: DATASET_ROUTES.getLiveCodebook.method,
          query: liveCodebookQuerySchema,
          output: codebookSchema,
        },
        async (ctx) => {
          const config = ctx.context.config;
          const form = await requireForm(
            config.forms,
            (id) => config.database.getForm(id),
            ctx.query.formId,
          );
          return liveCodebook(form);
        },
      ),
    },
  });
}
