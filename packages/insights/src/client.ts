import { defineClientPlugin } from "@dimah-form/core";

import { INSIGHTS_ID } from "./errors";
import { INSIGHTS_ROUTES } from "./routes";
import type { InsightsCrosstab, InsightsSummary } from "./spec";

export {
  insightsCrosstabQuerySchema,
  insightsCrosstabSchema,
  insightsSummaryQuerySchema,
  insightsSummarySchema,
  type InsightsCrosstab,
  type InsightsField,
  type InsightsFieldValue,
  type InsightsNumeric,
  type InsightsScoreVariable,
  type InsightsSeries,
  type InsightsStatusCounts,
  type InsightsSummary,
} from "./spec";
export { createInsightsAccumulator } from "./summary";
export { createInsightsCrosstabAccumulator } from "./crosstab";
export { INSIGHTS_ID } from "./errors";
export { INSIGHTS_ROUTES } from "./routes";

type InsightsFilterRequest = {
  formId: string;
  status?: "draft" | "submitted" | "abandoned";
  respondentId?: string;
  submittedFrom?: string;
  submittedTo?: string;
  updatedAfter?: string;
  whereField?: string;
  whereValue?: string;
  maxRows?: number;
  headers?: HeadersInit;
};

export type FormInsightsRequest = InsightsFilterRequest & {
  bucket?: "day";
};

export type FormCrosstabRequest = InsightsFilterRequest & {
  row: string;
  col: string;
};

function filterQuery(payload: InsightsFilterRequest) {
  return {
    formId: payload.formId,
    ...(payload.status ? { status: payload.status } : {}),
    ...(payload.respondentId ? { respondentId: payload.respondentId } : {}),
    ...(payload.submittedFrom ? { submittedFrom: payload.submittedFrom } : {}),
    ...(payload.submittedTo ? { submittedTo: payload.submittedTo } : {}),
    ...(payload.updatedAfter ? { updatedAfter: payload.updatedAfter } : {}),
    ...(payload.whereField ? { whereField: payload.whereField } : {}),
    ...(payload.whereValue !== undefined
      ? { whereValue: payload.whereValue }
      : {}),
    ...(payload.maxRows != null ? { maxRows: payload.maxRows } : {}),
  };
}

/**
 * Browser companion. Same id `"insights"`.
 */
export function insightsClientPlugin() {
  return defineClientPlugin({
    id: INSIGHTS_ID,
    endpoints: ({ $fetch }) => ({
      getFormInsights: (payload: FormInsightsRequest) =>
        $fetch<InsightsSummary>(INSIGHTS_ROUTES.getFormInsights.path, {
          method: "GET",
          query: {
            ...filterQuery(payload),
            ...(payload.bucket ? { bucket: payload.bucket } : {}),
          },
          ...(payload.headers ? { headers: payload.headers } : {}),
        }),
      getFormCrosstab: (payload: FormCrosstabRequest) =>
        $fetch<InsightsCrosstab>(INSIGHTS_ROUTES.getFormCrosstab.path, {
          method: "GET",
          query: {
            ...filterQuery(payload),
            row: payload.row,
            col: payload.col,
          },
          ...(payload.headers ? { headers: payload.headers } : {}),
        }),
    }),
  });
}
