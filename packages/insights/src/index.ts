export { insightsPlugin, type InsightsPluginOptions } from "./plugin";
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
