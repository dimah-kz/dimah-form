import { defineClientPlugin } from "@dimah-form/core";

import { INSIGHTS_ID } from "./errors";
import { INSIGHTS_ROUTES } from "./routes";
import type { InsightsSummary } from "./spec";

export {
  insightsSummaryQuerySchema,
  insightsSummarySchema,
  type InsightsField,
  type InsightsFieldValue,
  type InsightsScoreVariable,
  type InsightsStatusCounts,
  type InsightsSummary,
} from "./spec";
export { createInsightsAccumulator } from "./summary";
export { INSIGHTS_ID } from "./errors";
export { INSIGHTS_ROUTES } from "./routes";

export type FormInsightsRequest = {
  formId: string;
  status?: "draft" | "submitted" | "abandoned";
  respondentId?: string;
  submittedFrom?: string;
  submittedTo?: string;
  updatedAfter?: string;
  headers?: HeadersInit;
};

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
            formId: payload.formId,
            ...(payload.status ? { status: payload.status } : {}),
            ...(payload.respondentId
              ? { respondentId: payload.respondentId }
              : {}),
            ...(payload.submittedFrom
              ? { submittedFrom: payload.submittedFrom }
              : {}),
            ...(payload.submittedTo
              ? { submittedTo: payload.submittedTo }
              : {}),
            ...(payload.updatedAfter
              ? { updatedAfter: payload.updatedAfter }
              : {}),
          },
          ...(payload.headers ? { headers: payload.headers } : {}),
        }),
    }),
  });
}
