import { FORM_ERROR_CODES } from "./error";
import {
  createFormFetch,
  type FormClientFetchOptions,
  type FormFetch,
} from "./create-form-fetch";
import type { FieldTypeDefinition } from "./define";
import type { InferAnswersMap } from "./infer";
import {
  defineClientPlugin,
  type ClientPluginEndpointMap,
  type FormClientPlugin,
} from "./client-plugin";
import {
  FORM_API_BASE_PATH,
  FORM_API_ROUTES,
  normalizeFormApiBasePath,
} from "./routes";
import type { FormSnapshot, FormStatus } from "./schema/definition";
import type {
  FormAnswers,
  FormList,
  ResponseList,
  ResponseRecord,
  ResponseStatus,
} from "./schema/protocol";

export { defineClientPlugin, type FormClientPlugin };

export type CreateFormClientOptions<
  TPlugins extends readonly FormClientPlugin[] = readonly FormClientPlugin[],
> = {
  /** API path prefix — must match server `basePath`. @default "/api/form" */
  basePath?: string;
  /**
   * Absolute client origin + path (e.g. `https://api.example.com/api/form`).
   * Wins over {@link basePath} when both are set.
   */
  baseURL?: string;
  /** Browser companions to server plugins. Merged onto the returned client. */
  plugins?: TPlugins;
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

function asQuery(
  record: Record<string, string | number | undefined> | undefined,
) {
  if (!record) return undefined;
  const query: Record<string, string> = {};
  for (const [key, value] of Object.entries(record)) {
    if (value === undefined) continue;
    query[key] = String(value);
  }
  return Object.keys(query).length > 0 ? query : undefined;
}

/** Browser client uses object args (not better-call `{ body, query }`). */
export type FormClientApi = {
  getForm: (
    payload: { formId: string } & ClientHeaders,
  ) => Promise<FormSnapshot>;
  saveForm: (payload: FormSnapshot & ClientHeaders) => Promise<FormSnapshot>;
  deleteForm: (
    payload: { formId: string } & ClientHeaders,
  ) => Promise<{ ok: true; formId: string }>;
  listForms: (
    payload?: {
      status?: FormStatus;
      limit?: number;
      offset?: number;
    } & ClientHeaders,
  ) => Promise<FormList>;
  startResponse: (
    payload: { formId: string; respondentId?: string } & ClientHeaders,
  ) => Promise<ResponseRecord>;
  getResponse: (
    payload: { responseId: string } & ClientHeaders,
  ) => Promise<ResponseRecord>;
  listResponses: (
    payload?: {
      formId?: string;
      respondentId?: string;
      status?: ResponseStatus;
      include?: "summary" | "full";
      limit?: number;
      offset?: number;
    } & ClientHeaders,
  ) => Promise<ResponseList>;
  saveDraft: (
    payload: {
      responseId: string;
      answers: FormAnswers;
      updatedAt?: string;
    } & ClientHeaders,
  ) => Promise<ResponseRecord>;
  submitResponse: (
    payload: {
      responseId: string;
      answers?: FormAnswers;
      updatedAt?: string;
    } & ClientHeaders,
  ) => Promise<ResponseRecord>;
  abandonResponse: (
    payload: { responseId: string; updatedAt?: string } & ClientHeaders,
  ) => Promise<ResponseRecord>;
  deleteResponse: (
    payload: { responseId: string } & ClientHeaders,
  ) => Promise<{ ok: true; responseId: string }>;
};

export type CreateFormClientResult<
  TPlugins extends readonly FormClientPlugin[] = [],
  TForms extends Record<string, unknown> = Record<string, unknown>,
  TFieldTypes extends readonly FieldTypeDefinition[] = [],
> = FormClientApi &
  ClientPluginEndpointMap<TPlugins> & {
    $fetch: FormFetch;
    baseURL: string;
    $ERROR_CODES: typeof FORM_ERROR_CODES;
    $Infer: {
      forms: TForms;
      answers: InferAnswersMap<TForms, TFieldTypes>;
      plugins: TPlugins;
    };
  };

const CORE_CLIENT_KEYS = new Set([
  "getForm",
  "saveForm",
  "deleteForm",
  "listForms",
  "startResponse",
  "getResponse",
  "listResponses",
  "saveDraft",
  "submitResponse",
  "abandonResponse",
  "deleteResponse",
  "$fetch",
  "baseURL",
  "$ERROR_CODES",
  "$Infer",
]);

/** Typed better-fetch client for the questionnaire protocol. */
export function createFormClient<
  const TPlugins extends readonly FormClientPlugin[] = [],
  TForms extends Record<string, unknown> = Record<string, unknown>,
  TFieldTypes extends readonly FieldTypeDefinition[] = [],
>(
  options: CreateFormClientOptions<TPlugins> = {},
): CreateFormClientResult<TPlugins, TForms, TFieldTypes> {
  const { basePath, baseURL, plugins, ...fetchOptions } = options;
  const base = normalizeFormApiBasePath(
    baseURL ?? basePath ?? FORM_API_BASE_PATH,
  );
  const $fetch = createFormFetch(base, fetchOptions);

  function get<T>(
    path: string,
    payload: ClientHeaders | undefined,
    query?: Record<string, string | number | undefined>,
  ) {
    return $fetch<T>(path, {
      method: "GET",
      ...(asQuery(query) ? { query: asQuery(query) } : {}),
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

  const api: FormClientApi & {
    $fetch: FormFetch;
    baseURL: string;
    $ERROR_CODES: typeof FORM_ERROR_CODES;
    $Infer: CreateFormClientResult<TPlugins, TForms, TFieldTypes>["$Infer"];
  } = {
    getForm(payload) {
      return get<FormSnapshot>(FORM_API_ROUTES.form, payload, {
        formId: payload.formId,
      });
    },
    saveForm(payload) {
      return post<FormSnapshot>(FORM_API_ROUTES.form, payload);
    },
    deleteForm(payload) {
      return post<{ ok: true; formId: string }>(
        FORM_API_ROUTES.deleteForm,
        payload,
      );
    },
    listForms(payload = {}) {
      return get<FormList>(FORM_API_ROUTES.forms, payload, {
        status: payload.status,
        limit: payload.limit,
        offset: payload.offset,
      });
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
      return get<ResponseList>(FORM_API_ROUTES.responses, payload, {
        formId: payload.formId,
        respondentId: payload.respondentId,
        status: payload.status,
        include: payload.include,
        limit: payload.limit,
        offset: payload.offset,
      });
    },
    saveDraft(payload) {
      return post<ResponseRecord>(FORM_API_ROUTES.saveDraft, payload);
    },
    submitResponse(payload) {
      return post<ResponseRecord>(FORM_API_ROUTES.submitResponse, payload);
    },
    abandonResponse(payload) {
      return post<ResponseRecord>(FORM_API_ROUTES.abandonResponse, payload);
    },
    deleteResponse(payload) {
      return post<{ ok: true; responseId: string }>(
        FORM_API_ROUTES.deleteResponse,
        payload,
      );
    },
    $fetch,
    baseURL: base,
    $ERROR_CODES: FORM_ERROR_CODES,
    $Infer: undefined as unknown as CreateFormClientResult<
      TPlugins,
      TForms,
      TFieldTypes
    >["$Infer"],
  };

  const seen = new Set<string>();
  for (const plugin of plugins ?? []) {
    if (seen.has(plugin.id)) {
      throw new Error(
        `Duplicate dimah-form client plugin id "${plugin.id}". Each plugin id must be unique.`,
      );
    }
    seen.add(plugin.id);
    const extra = plugin.endpoints?.({ $fetch }) ?? {};
    for (const [name, fn] of Object.entries(extra)) {
      if (CORE_CLIENT_KEYS.has(name) || name in api) {
        throw new Error(
          `Duplicate dimah-form client endpoint "${name}". Plugin "${plugin.id}" conflicts with a core or plugin method.`,
        );
      }
      (api as Record<string, unknown>)[name] = fn;
    }
  }

  return api as unknown as CreateFormClientResult<
    TPlugins,
    TForms,
    TFieldTypes
  >;
}
