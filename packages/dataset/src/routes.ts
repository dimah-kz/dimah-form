/** Plugin routes — not core protocol. Shared by the server and client plugins. */
export const DATASET_ROUTES = {
  getDatasetPage: { method: "GET", path: "/dataset/responses" },
  getDatasetCodebook: { method: "GET", path: "/dataset/codebook/history" },
  getLiveCodebook: { method: "GET", path: "/dataset/codebook" },
} as const;
