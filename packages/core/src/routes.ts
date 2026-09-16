export const FORM_API_BASE_PATH = "/api/form";

export function normalizeFormApiBasePath(basePath = FORM_API_BASE_PATH) {
  const trimmed = basePath.trim() || FORM_API_BASE_PATH;
  return trimmed.startsWith("/") ? trimmed.replace(/\/$/, "") : `/${trimmed}`;
}

/** Relative paths under {@link FORM_API_BASE_PATH}. Always start with `/`. */
export const FORM_API_ROUTES = {
  form: "/form",
  startResponse: "/response/start",
  getResponse: "/response",
  saveDraft: "/response/draft",
  submitResponse: "/response/submit",
} as const;
