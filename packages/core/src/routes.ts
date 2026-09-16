export const FORM_API_BASE_PATH = "/api/form";

const ABSOLUTE_URL = /^[a-z][a-z0-9+.-]*:/i;

/**
 * Normalize a client `baseURL` / `basePath` or server `basePath`.
 * Absolute URLs keep their scheme; relative paths always start with `/`
 * and never end with one.
 */
export function normalizeFormApiBasePath(basePath = FORM_API_BASE_PATH) {
  const trimmed = basePath.trim() || FORM_API_BASE_PATH;
  const stripped = trimmed.replace(/\/+$/, "") || FORM_API_BASE_PATH;
  if (ABSOLUTE_URL.test(stripped)) return stripped;
  return stripped.startsWith("/") ? stripped : `/${stripped}`;
}

/** Relative paths under {@link FORM_API_BASE_PATH}. Always start with `/`. */
export const FORM_API_ROUTES = {
  form: "/form",
  forms: "/forms",
  deleteForm: "/form/delete",
  startResponse: "/response/start",
  getResponse: "/response",
  responses: "/responses",
  saveDraft: "/response/draft",
  submitResponse: "/response/submit",
  abandonResponse: "/response/abandon",
  reopenResponse: "/response/reopen",
  deleteResponse: "/response/delete",
} as const;

/** Core protocol: operation name → HTTP method + path. */
export const FORM_API_OPERATIONS = {
  getForm: { method: "GET", path: FORM_API_ROUTES.form },
  saveForm: { method: "POST", path: FORM_API_ROUTES.form },
  deleteForm: { method: "POST", path: FORM_API_ROUTES.deleteForm },
  listForms: { method: "GET", path: FORM_API_ROUTES.forms },
  startResponse: { method: "POST", path: FORM_API_ROUTES.startResponse },
  getResponse: { method: "GET", path: FORM_API_ROUTES.getResponse },
  listResponses: { method: "GET", path: FORM_API_ROUTES.responses },
  saveDraft: { method: "POST", path: FORM_API_ROUTES.saveDraft },
  submitResponse: { method: "POST", path: FORM_API_ROUTES.submitResponse },
  abandonResponse: { method: "POST", path: FORM_API_ROUTES.abandonResponse },
  reopenResponse: { method: "POST", path: FORM_API_ROUTES.reopenResponse },
  deleteResponse: { method: "POST", path: FORM_API_ROUTES.deleteResponse },
} as const;

export type FormApiOperation = keyof typeof FORM_API_OPERATIONS;

export function formApiRouteKey(method: string, path: string) {
  return `${method} ${path}`;
}

/** `"GET /form"` → `"getForm"`. */
export const FORM_API_ROUTE_KEYS = Object.fromEntries(
  Object.entries(FORM_API_OPERATIONS).map(([operation, spec]) => [
    formApiRouteKey(spec.method, spec.path),
    operation,
  ]),
) as Record<string, FormApiOperation>;
