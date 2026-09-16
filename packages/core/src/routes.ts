export const FORM_API_BASE_PATH = "/api/form";

export function normalizeFormApiBasePath(basePath = FORM_API_BASE_PATH) {
  const trimmed = basePath.trim() || FORM_API_BASE_PATH;
  return trimmed.startsWith("/") ? trimmed.replace(/\/$/, "") : `/${trimmed}`;
}
