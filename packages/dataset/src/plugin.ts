import {
  normalizeListPage,
  pageFromOverfetch,
  type FieldTypeDefinition,
  type ResponseRecord,
} from "@dimah-form/core";
import {
  createFormEndpoint,
  DEFAULT_WALK_MAX_ROWS,
  definePlugin,
  getPluginContext,
  resolveLiveForm,
  walkFullResponses,
} from "@dimah-form/server";

import { buildCodebook, liveCodebook, type CodebookSource } from "./codebook";
import { DATASET_ID } from "./errors";
import { snapshotKey, type SnapshotKeyCache } from "./hash";
import { projectResponse } from "./project";
import { datasetStoreFilter } from "./query";
import { DATASET_ROUTES } from "./routes";
import { tryScoreResponse } from "./scoring";
import {
  DATASET_SPEC,
  codebookSchema,
  datasetCodebookQuerySchema,
  datasetCodebookResultSchema,
  datasetPageQuerySchema,
  datasetPageSchema,
  liveCodebookQuerySchema,
  type Codebook,
  type DatasetCodebookResult,
  type DatasetPage,
  type DatasetRecord,
} from "./spec";

type DatasetPluginContext = {
  fieldTypes: ReadonlyMap<string, FieldTypeDefinition>;
};

export type OnProjectContext = {
  response: ResponseRecord;
  record: DatasetRecord;
  request: Request;
};

export type DatasetPluginOptions = {
  /**
   * After submit persist. Write the projected record to your warehouse.
   * Must not mutate `response.answers`. Throwing fails the submit HTTP
   * response after persist.
   */
  onProject?: (context: OnProjectContext) => void | Promise<void>;
  /**
   * Cap for the historical codebook walk. Query cannot raise this.
   * @default 10_000
   */
  maxRows?: number;
};

function isFullRecord(row: { definition?: unknown }): row is ResponseRecord {
  return "definition" in row && row.definition != null;
}

function fieldTypesOf(config: {
  pluginContext: ReadonlyMap<string, unknown>;
}): ReadonlyMap<string, FieldTypeDefinition> | undefined {
  return getPluginContext<DatasetPluginContext>(config, DATASET_ID)?.fieldTypes;
}

async function projectRow(
  row: ResponseRecord,
  fieldTypes: ReadonlyMap<string, FieldTypeDefinition> | undefined,
  cache: SnapshotKeyCache,
): Promise<{ record: DatasetRecord; snapshotKey: string }> {
  const key = await snapshotKey(row.definition, cache);
  const scores = await tryScoreResponse(row.definition, row.answers);
  const record = await projectResponse(row, {
    fieldTypes,
    scores,
    includeRespondentId: true,
    snapshotKey: key,
    snapshotKeyCache: cache,
  });
  return { record, snapshotKey: key };
}

async function walkCodebook(
  filter: Parameters<typeof walkFullResponses>[1],
  listResponses: Parameters<typeof walkFullResponses>[0],
  signal: AbortSignal,
  maxRows: number,
): Promise<{ codebook: Codebook; truncated: boolean }> {
  const cache: SnapshotKeyCache = new Map();
  const sources: CodebookSource[] = [];
  const walk = await walkFullResponses(listResponses, filter, {
    signal,
    maxRows,
    visit: async (row) => {
      const key = await snapshotKey(row.definition, cache);
      sources.push({
        snapshotKey: key,
        definition: row.definition,
        seenAt: row.submittedAt ?? row.createdAt,
      });
    },
  });
  return {
    codebook: buildCodebook(sources),
    truncated: walk.truncated,
  };
}

/**
 * Official dataset plugin. Compute-on-read JSONL + codebook pages.
 * Does not add a `meta` namespace. Full-file zip stays in the app.
 */
export function datasetPlugin(options: DatasetPluginOptions = {}) {
  const onProject = options.onProject;
  const maxRowsCap = options.maxRows ?? DEFAULT_WALK_MAX_ROWS;
  const state: { fieldTypes?: ReadonlyMap<string, FieldTypeDefinition> } = {};

  return definePlugin({
    id: DATASET_ID,
    init(ctx) {
      state.fieldTypes = ctx.fieldTypes;
      return { context: { fieldTypes: ctx.fieldTypes } };
    },
    hooks: onProject
      ? {
          afterSubmit: async ({ response, request }) => {
            const scores = await tryScoreResponse(
              response.definition,
              response.answers,
            );
            const record = await projectResponse(response, {
              fieldTypes: state.fieldTypes,
              scores,
              includeRespondentId: true,
            });
            await onProject({ response, record, request });
          },
        }
      : undefined,
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
          const form = await resolveLiveForm(config, ctx.query.formId);
          const { limit, offset } = normalizeListPage(ctx.query);
          const filter = datasetStoreFilter({
            ...ctx.query,
            formId: form.id,
          });
          const [rows, total] = await Promise.all([
            config.database.listResponses({
              ...filter,
              include: "full",
              limit: limit + 1,
              offset,
            }),
            config.database.countResponses(filter),
          ]);
          const page = pageFromOverfetch(rows, limit, offset);
          const cache: SnapshotKeyCache = new Map();
          const fieldTypes = fieldTypesOf(config);
          const records = [];
          const sources = [];
          for (const row of page.items) {
            if (!isFullRecord(row)) continue;
            const projected = await projectRow(row, fieldTypes, cache);
            records.push(projected.record);
            sources.push({
              snapshotKey: projected.snapshotKey,
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
            total,
          };
        },
      ),
      getDatasetCodebook: createFormEndpoint(
        DATASET_ROUTES.getDatasetCodebook.path,
        {
          method: DATASET_ROUTES.getDatasetCodebook.method,
          query: datasetCodebookQuerySchema,
          output: datasetCodebookResultSchema,
        },
        async (ctx): Promise<DatasetCodebookResult> => {
          const config = ctx.context.config;
          const form = await resolveLiveForm(config, ctx.query.formId);
          const filter = datasetStoreFilter({
            ...ctx.query,
            formId: form.id,
          });
          const [total, history] = await Promise.all([
            config.database.countResponses(filter),
            walkCodebook(
              filter,
              (query) => config.database.listResponses(query),
              ctx.context.request.signal,
              maxRowsCap,
            ),
          ]);
          return {
            spec: DATASET_SPEC,
            codebook: history.codebook,
            total,
            truncated: history.truncated,
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
          const form = await resolveLiveForm(config, ctx.query.formId);
          return liveCodebook(form);
        },
      ),
    },
  });
}
