import type { FieldTypeDefinition, FormField } from "@dimah-form/core";
import { tryScoreResponse } from "@dimah-form/scoring/document";
import {
  createFormEndpoint,
  DEFAULT_WALK_MAX_ROWS,
  definePlugin,
  getPluginContext,
  resolveLiveForm,
  walkFullResponses,
  type ListResponsesStoreQuery,
} from "@dimah-form/server";

import { createInsightsCrosstabAccumulator } from "./crosstab";
import { INSIGHTS_ID } from "./errors";
import { INSIGHTS_ROUTES } from "./routes";
import {
  insightsCrosstabQuerySchema,
  insightsCrosstabSchema,
  insightsSummaryQuerySchema,
  insightsSummarySchema,
  isIanaTimeZone,
  type InsightsCrosstab,
  type InsightsSummary,
} from "./spec";
import { createInsightsAccumulator } from "./summary";
import { rowMatchesWhere } from "./where";

type InsightsPluginContext = {
  fieldTypes: ReadonlyMap<string, FieldTypeDefinition>;
  timeZone: string;
};

export type InsightsPluginOptions = {
  /**
   * Cap for summary and crosstab walks. Query `maxRows` may lower this,
   * not raise it.
   * @default 10_000
   */
  maxRows?: number;
  /**
   * IANA zone for `bucket=day`. Query `timeZone` overrides this.
   * @default "UTC"
   */
  timeZone?: string;
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

/**
 * Live field for catalog order. A missing or non-categorical live field
 * does not reject the query — each snapshot decides whether the axis counts.
 */
function crosstabAxis(
  form: { fields: readonly FormField[] },
  fieldId: string,
): FormField {
  return (
    form.fields.find((item) => item.id === fieldId) ?? {
      id: fieldId,
      type: "text",
    }
  );
}

/**
 * Official insights plugin. Compute-on-read counts from response snapshots.
 * Does not add tables or a `meta` namespace. Large N belongs in a warehouse.
 */
export function insightsPlugin(options: InsightsPluginOptions = {}) {
  const maxRowsCap = options.maxRows ?? DEFAULT_WALK_MAX_ROWS;
  const timeZone = options.timeZone ?? "UTC";
  if (!isIanaTimeZone(timeZone)) {
    throw new Error(`Invalid IANA time zone "${timeZone}".`);
  }

  return definePlugin({
    id: INSIGHTS_ID,
    init(ctx) {
      return {
        context: {
          fieldTypes: ctx.fieldTypes,
          timeZone,
        } satisfies InsightsPluginContext,
      };
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
          const plugin = getPluginContext<InsightsPluginContext>(
            config,
            INSIGHTS_ID,
          );
          const filter = storeFilter(form.id, ctx.query);
          const acc = createInsightsAccumulator(form.id, {
            fieldTypes: plugin?.fieldTypes ?? config.fieldTypes,
            series: ctx.query.bucket === "day",
            liveFields: form.fields,
            liveMeta: form.meta,
            timeZone: ctx.query.timeZone ?? plugin?.timeZone ?? "UTC",
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
                const scores = tryScoreResponse(row.definition, row.answers);
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
          const rowField = crosstabAxis(form, ctx.query.row);
          const colField = crosstabAxis(form, ctx.query.col);
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
