import { defineClientPlugin } from "@dimah-form/core";
import type * as z from "zod";

import { INSIGHTS_ID } from "./errors";
import { INSIGHTS_ROUTES } from "./routes";
import type {
  insightsCrosstabQuerySchema,
  insightsSummaryQuerySchema,
  InsightsCrosstab,
  InsightsSummary,
} from "./spec";

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

type ClientRequest<T> = T & { headers?: HeadersInit };

export type FormInsightsRequest = ClientRequest<
  z.output<typeof insightsSummaryQuerySchema>
>;

export type FormCrosstabRequest = ClientRequest<
  z.output<typeof insightsCrosstabQuerySchema>
>;

function withoutHeaders<T extends { headers?: HeadersInit }>(payload: T) {
  const { headers: _headers, ...query } = payload;
  return Object.fromEntries(
    Object.entries(query).filter(([, value]) => value !== undefined),
  );
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
          query: withoutHeaders(payload),
          ...(payload.headers ? { headers: payload.headers } : {}),
        }),
      getFormCrosstab: (payload: FormCrosstabRequest) =>
        $fetch<InsightsCrosstab>(INSIGHTS_ROUTES.getFormCrosstab.path, {
          method: "GET",
          query: withoutHeaders(payload),
          ...(payload.headers ? { headers: payload.headers } : {}),
        }),
    }),
  });
}
