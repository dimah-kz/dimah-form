/** Plugin routes — not core protocol. Shared by the server and client plugins. */
export const DATASET_ROUTES = {
  getDatasetPage: { method: "GET", path: "/dataset/responses" },
  getLiveCodebook: { method: "GET", path: "/dataset/codebook" },
} as const;
