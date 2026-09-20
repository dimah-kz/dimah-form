/** Plugin routes — not core protocol. Shared by the server and client plugins. */
export const SCORING_ROUTES = {
  getResponseScores: { method: "GET", path: "/scoring/response" },
} as const;
