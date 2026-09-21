/** Plugin routes — not core protocol. Shared by the server and client plugins. */
export const INSIGHTS_ROUTES = {
  getFormInsights: { method: "GET", path: "/insights/summary" },
  getFormCrosstab: { method: "GET", path: "/insights/crosstab" },
} as const;
