import {
  FIELD_ISSUE_CODES,
  type FieldTypeDefinition,
  type FormField,
} from "@dimah-form/core";
import {
  createFormEndpoint,
  DEFAULT_WALK_MAX_ROWS,
  definePlugin,
  errors,
  resolveLiveForm,
  walkFullResponses,
  type ListResponsesStoreQuery,
} from "@dimah-form/server";

import { isCategoricalField } from "./categorical";
import { createInsightsCrosstabAccumulator } from "./crosstab";
import { INSIGHTS_ID } from "./errors";
import { INSIGHTS_ROUTES } from "./routes";
import { tryScoreResponse } from "./scoring";
import {
  insightsCrosstabQuerySchema,
  insightsCrosstabSchema,
  insightsSummaryQuerySchema,
  insightsSummarySchema,
  type InsightsCrosstab,
  type InsightsSummary,
} from "./spec";
import { createInsightsAccumulator } from "./summary";
import { rowMatchesWhere } from "./where";

export type InsightsPluginOptions = {
  /**
   * Cap for summary and crosstab walks. Query `maxRows` may lower this,
   * not raise it.
   * @default 10_000
   */
  maxRows?: number;
};

function storeFilter(
  formId: string,
  query: {
    respondentId?: string;
    status?: ListResponsesStoreQuery["status"];
    submittedFrom?: string;
    submittedTo?: string;
    updatedAfter?: string;
  },
): ListResponsesStoreQuery {
  return {
    formId,
    ...(query.respondentId ? { respondentId: query.respondentId } : {}),
    ...(query.status ? { status: query.status } : {}),
    ...(query.submittedFrom ? { submittedFrom: query.submittedFrom } : {}),
    ...(query.submittedTo ? { submittedTo: query.submittedTo } : {}),
    ...(query.updatedAfter ? { updatedAfter: query.updatedAfter } : {}),
  };
}

function walkCap(pluginCap: number, queryMaxRows?: number): number {
  return Math.min(queryMaxRows ?? pluginCap, pluginCap);
}

function crosstabAxis(
  form: { fields: readonly FormField[] },
  fieldId: string,
  queryField: "row" | "col",
): FormField {
  const field = form.fields.find((item) => item.id === fieldId);
  if (!field) return { id: fieldId, type: "select" };
  if (!isCategoricalField(field)) {
    throw errors.validationError([
      {
        field: queryField,
        message: `Crosstab ${queryField} field must be categorical`,
        code: FIELD_ISSUE_CODES.INVALID.code,
      },
    ]);
  }
  return field;
}

/**
 * Official insights plugin. Compute-on-read counts from response snapshots.
 * Does not add tables or a `meta` namespace. Large N belongs in a warehouse.
 */
export function insightsPlugin(options: InsightsPluginOptions = {}) {
  const maxRowsCap = options.maxRows ?? DEFAULT_WALK_MAX_ROWS;
  const state: { fieldTypes?: ReadonlyMap<string, FieldTypeDefinition> } = {};

  return definePlugin({
    id: INSIGHTS_ID,
    init(ctx) {
      state.fieldTypes = ctx.fieldTypes;
      return { context: { fieldTypes: ctx.fieldTypes } };
    },
    endpoints: {
      getFormInsights: createFormEndpoint(
        INSIGHTS_ROUTES.getFormInsights.path,
        {
          method: INSIGHTS_ROUTES.getFormInsights.method,
          query: insightsSummaryQuerySchema,
          output: insightsSummarySchema,
        },
        async (ctx): Promise<InsightsSummary> => {
          const config = ctx.context.config;
          const form = await resolveLiveForm(config, ctx.query.formId);
          const filter = storeFilter(form.id, ctx.query);
          const acc = createInsightsAccumulator(form.id, {
            fieldTypes: state.fieldTypes ?? config.fieldTypes,
            series: ctx.query.bucket === "day",
            liveFields: form.fields,
            liveMeta: form.meta,
          });
          const whereField = ctx.query.whereField;
          const whereValue = ctx.query.whereValue;
          const walk = await walkFullResponses(
            (query) => config.database.listResponses(query),
            filter,
            {
              signal: ctx.context.request.signal,
              maxRows: walkCap(maxRowsCap, ctx.query.maxRows),
              visit: async (row) => {
                if (
                  whereField != null &&
                  whereValue != null &&
                  !rowMatchesWhere(row, whereField, whereValue)
                ) {
                  return;
                }
                const scores = await tryScoreResponse(
                  row.definition,
                  row.answers,
                );
                acc.add(row, scores);
              },
            },
          );
          return {
            ...acc.finish(),
            scanned: walk.scanned,
            truncated: walk.truncated,
          };
        },
      ),
      getFormCrosstab: createFormEndpoint(
        INSIGHTS_ROUTES.getFormCrosstab.path,
        {
          method: INSIGHTS_ROUTES.getFormCrosstab.method,
          query: insightsCrosstabQuerySchema,
          output: insightsCrosstabSchema,
        },
        async (ctx): Promise<InsightsCrosstab> => {
          const config = ctx.context.config;
          const form = await resolveLiveForm(config, ctx.query.formId);
          const rowField = crosstabAxis(form, ctx.query.row, "row");
          const colField = crosstabAxis(form, ctx.query.col, "col");
          const filter = storeFilter(form.id, ctx.query);
          const acc = createInsightsCrosstabAccumulator(
            form.id,
            rowField,
            colField,
          );
          const whereField = ctx.query.whereField;
          const whereValue = ctx.query.whereValue;
          const walk = await walkFullResponses(
            (query) => config.database.listResponses(query),
            filter,
            {
              signal: ctx.context.request.signal,
              maxRows: walkCap(maxRowsCap, ctx.query.maxRows),
              visit: (row) => {
                if (
                  whereField != null &&
                  whereValue != null &&
                  !rowMatchesWhere(row, whereField, whereValue)
                ) {
                  return;
                }
                acc.add(row);
              },
            },
          );
          return {
            ...acc.finish(),
            scanned: walk.scanned,
            truncated: walk.truncated,
          };
        },
      ),
    },
  });
}
