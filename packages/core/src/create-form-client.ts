import { FORM_ERROR_CODES } from "./error";
import {
  createFormFetch,
  type FormClientFetchOptions,
} from "./create-form-fetch";
import {
  FORM_API_BASE_PATH,
  FORM_API_ROUTES,
  normalizeFormApiBasePath,
} from "./routes";
import type { FormSnapshot } from "./schema/definition";
import type { FormAnswers, ResponseRecord } from "./schema/protocol";

export type CreateFormClientOptions = {
  /** API path prefix — must match server `basePath`. @default "/api/form" */
  basePath?: string;
  /**
   * Absolute client origin + path (e.g. `https://api.example.com/api/form`).
   * Wins over {@link basePath} when both are set.
   */
  baseURL?: string;
} & FormClientFetchOptions;

type ClientHeaders = {
  headers?: HeadersInit;
};

/** Browser client uses object args (not better-call `{ body, query }`). */
export type FormClientApi = {
  getForm: (
    payload: { formId: string } & ClientHeaders,
  ) => Promise<FormSnapshot>;
  startResponse: (
    payload: { formId: string } & ClientHeaders,
  ) => Promise<ResponseRecord>;
  getResponse: (
    payload: { responseId: string } & ClientHeaders,
  ) => Promise<ResponseRecord>;
  saveDraft: (
    payload: { responseId: string; answers: FormAnswers } & ClientHeaders,
  ) => Promise<ResponseRecord>;
  submitResponse: (
    payload: { responseId: string; answers: FormAnswers } & ClientHeaders,
  ) => Promise<ResponseRecord>;
};

/** Strip server-only `headers` before sending over HTTP. */
function withoutHeaders<T extends { headers?: HeadersInit }>(
  value: T,
): Omit<T, "headers"> {
  const { headers: _headers, ...rest } = value;
  return rest;
}

export type CreateFormClientResult = FormClientApi & {
  $fetch: ReturnType<typeof createFormFetch>;
  baseURL: string;
  $ERROR_CODES: typeof FORM_ERROR_CODES;
};

/** Typed better-fetch client for the questionnaire protocol. */
export function createFormClient(
  options: CreateFormClientOptions = {},
): CreateFormClientResult {
  const { basePath, baseURL, ...fetchOptions } = options;
  const base = normalizeFormApiBasePath(
    baseURL ?? basePath ?? FORM_API_BASE_PATH,
  );
  const $fetch = createFormFetch(base, fetchOptions);

  return {
    getForm(payload) {
      const { formId } = withoutHeaders(payload);
      return $fetch<FormSnapshot>(FORM_API_ROUTES.form, {
        method: "GET",
        query: { formId },
      });
    },
    startResponse(payload) {
      return $fetch<ResponseRecord>(FORM_API_ROUTES.startResponse, {
        method: "POST",
        body: withoutHeaders(payload),
      });
    },
    getResponse(payload) {
      const { responseId } = withoutHeaders(payload);
      return $fetch<ResponseRecord>(FORM_API_ROUTES.getResponse, {
        method: "GET",
        query: { responseId },
      });
    },
    saveDraft(payload) {
      return $fetch<ResponseRecord>(FORM_API_ROUTES.saveDraft, {
        method: "POST",
        body: withoutHeaders(payload),
      });
    },
    submitResponse(payload) {
      return $fetch<ResponseRecord>(FORM_API_ROUTES.submitResponse, {
        method: "POST",
        body: withoutHeaders(payload),
      });
    },
    $fetch,
    baseURL: base,
    $ERROR_CODES: FORM_ERROR_CODES,
  };
}
