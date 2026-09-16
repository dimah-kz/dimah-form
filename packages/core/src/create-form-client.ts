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
import type {
  FormAnswers,
  FormList,
  ResponseList,
  ResponseRecord,
} from "./schema/protocol";

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

function callHeaders(payload: ClientHeaders | undefined) {
  return payload?.headers ? { headers: payload.headers } : {};
}

/** Strip server-only `headers` before sending over HTTP. */
function withoutHeaders<T extends { headers?: HeadersInit }>(
  value: T,
): Omit<T, "headers"> {
  const { headers: _headers, ...rest } = value;
  return rest;
}

/** Browser client uses object args (not better-call `{ body, query }`). */
export type FormClientApi = {
  getForm: (
    payload: { formId: string } & ClientHeaders,
  ) => Promise<FormSnapshot>;
  saveForm: (payload: FormSnapshot & ClientHeaders) => Promise<FormSnapshot>;
  listForms: (payload?: ClientHeaders) => Promise<FormList>;
  startResponse: (
    payload: { formId: string; respondentId?: string } & ClientHeaders,
  ) => Promise<ResponseRecord>;
  getResponse: (
    payload: { responseId: string } & ClientHeaders,
  ) => Promise<ResponseRecord>;
  listResponses: (
    payload?: { formId?: string } & ClientHeaders,
  ) => Promise<ResponseList>;
  saveDraft: (
    payload: { responseId: string; answers: FormAnswers } & ClientHeaders,
  ) => Promise<ResponseRecord>;
  submitResponse: (
    payload: { responseId: string; answers: FormAnswers } & ClientHeaders,
  ) => Promise<ResponseRecord>;
};

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

  function get<T>(
    path: string,
    payload: ClientHeaders | undefined,
    query?: Record<string, string>,
  ) {
    return $fetch<T>(path, {
      method: "GET",
      ...(query ? { query } : {}),
      ...callHeaders(payload),
    });
  }

  function post<T>(path: string, payload: ClientHeaders) {
    return $fetch<T>(path, {
      method: "POST",
      body: withoutHeaders(payload),
      ...callHeaders(payload),
    });
  }

  return {
    getForm(payload) {
      return get<FormSnapshot>(FORM_API_ROUTES.form, payload, {
        formId: payload.formId,
      });
    },
    saveForm(payload) {
      return post<FormSnapshot>(FORM_API_ROUTES.form, payload);
    },
    listForms(payload) {
      return get<FormList>(FORM_API_ROUTES.forms, payload);
    },
    startResponse(payload) {
      return post<ResponseRecord>(FORM_API_ROUTES.startResponse, payload);
    },
    getResponse(payload) {
      return get<ResponseRecord>(FORM_API_ROUTES.getResponse, payload, {
        responseId: payload.responseId,
      });
    },
    listResponses(payload = {}) {
      return get<ResponseList>(
        FORM_API_ROUTES.responses,
        payload,
        payload.formId ? { formId: payload.formId } : undefined,
      );
    },
    saveDraft(payload) {
      return post<ResponseRecord>(FORM_API_ROUTES.saveDraft, payload);
    },
    submitResponse(payload) {
      return post<ResponseRecord>(FORM_API_ROUTES.submitResponse, payload);
    },
    $fetch,
    baseURL: base,
    $ERROR_CODES: FORM_ERROR_CODES,
  };
}
