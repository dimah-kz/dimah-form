import type { FORM_ERROR_CODES } from "./error";
import {
  createFormFetch,
  type FormClientFetchOptions,
  type FormFetch,
} from "./create-form-fetch";
import { chainAnswersValidators, type AnswersValidator } from "./answers";
import type { FieldTypeDefinition } from "./define";
import type { InferAnswersMap } from "./infer";
import {
  defineClientPlugin,
  type ClientPluginEndpointMap,
  type FormClientPlugin,
} from "./client-plugin";
import { applyClientPlugins } from "./plugin/apply-client-plugins";
import type { PluginErrorCodeMap, PluginFieldTypeUnion } from "./plugin/types";
import { createFieldTypeRegistry } from "./field-types";
import {
  FORM_API_BASE_PATH,
  FORM_API_OPERATIONS,
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

/**
 * `dimahForm()` instance shape for `createFormClient<typeof form>()`.
 * Type-only — never pass the server instance at runtime.
 */
export type FormServerLike = {
  readonly $Infer: {
    forms: Record<string, unknown>;
    answers: unknown;
  };
};

type InferClientForms<TServer, TForms> = TServer extends {
  $Infer: { forms: infer F extends Record<string, unknown> };
}
  ? F
  : TForms;

type ClientFieldTypes<
  TPlugins extends readonly FormClientPlugin[],
  TFieldTypes extends readonly FieldTypeDefinition[],
> = readonly (PluginFieldTypeUnion<TPlugins> | TFieldTypes[number])[];

type InferClientAnswers<
  TServer,
  TForms extends Record<string, unknown>,
  TPlugins extends readonly FormClientPlugin[],
  TFieldTypes extends readonly FieldTypeDefinition[],
> = TServer extends { $Infer: { answers: infer A } }
  ? A
  : InferAnswersMap<TForms, ClientFieldTypes<TPlugins, TFieldTypes>>;

export type CreateFormClientOptions<
  TPlugins extends readonly FormClientPlugin[] = readonly FormClientPlugin[],
  TForms extends Record<string, unknown> = Record<string, unknown>,
  TFieldTypes extends readonly FieldTypeDefinition[] =
    readonly FieldTypeDefinition[],
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
  /**
   * Code-authored catalog for `$Infer` only — not sent over the network.
   * Skip this when using `createFormClient<typeof form>()`.
   */
  forms?: TForms;
  /**
   * Custom field types. Used for `$Infer` (when not using
   * `createFormClient<typeof form>()`) and kept at runtime for
   * `createFormResponseSession` / `useFormResponse` validation.
   * `$Infer` from the server type does not install validators — pass the
   * same array as `dimahForm({ fieldTypes })`, or register them on client
   * plugins.
   */
  fieldTypes?: TFieldTypes;
  /**
   * Same function as `dimahForm({ validateAnswers })`. Used by the fill
   * session for local checks. Plugin `validateAnswers` callbacks run first.
   */
  validateAnswers?: AnswersValidator;
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
    payload: {
      formId: string;
      respondentId?: string;
      resume?: boolean;
    } & ClientHeaders,
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
      submittedFrom?: string;
      submittedTo?: string;
      updatedAfter?: string;
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
  reopenResponse: (
    payload: { responseId: string; updatedAt?: string } & ClientHeaders,
  ) => Promise<ResponseRecord>;
  deleteResponse: (
    payload: { responseId: string } & ClientHeaders,
  ) => Promise<{ ok: true; responseId: string }>;
};

export type CreateFormClientResult<
  TPlugins extends readonly FormClientPlugin[] = readonly FormClientPlugin[],
  TForms extends Record<string, unknown> = Record<string, unknown>,
  TFieldTypes extends readonly FieldTypeDefinition[] =
    readonly FieldTypeDefinition[],
  TServer = undefined,
> = FormClientApi &
  ClientPluginEndpointMap<TPlugins> & {
    $fetch: FormFetch;
    baseURL: string;
    /** Runtime field types for local session validation (plugins, then options). */
    fieldTypes: ClientFieldTypes<TPlugins, TFieldTypes>;
    /** Form-level validator for the fill session. */
    validateAnswers?: AnswersValidator;
    $ERROR_CODES: typeof FORM_ERROR_CODES & PluginErrorCodeMap<TPlugins>;
    $Infer: {
      forms: InferClientForms<TServer, TForms>;
      answers: InferClientAnswers<TServer, TForms, TPlugins, TFieldTypes>;
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
  "reopenResponse",
  "deleteResponse",
  "$fetch",
  "baseURL",
  "$ERROR_CODES",
  "$Infer",
  "fieldTypes",
  "validateAnswers",
  // React wrapper — `@dimah-form/react` overwrites these after merge.
  "Provider",
  "useFormClient",
  "useFormResponse",
]);

/**
 * Typed better-fetch client for the questionnaire protocol.
 *
 * Prefer `createFormClient<typeof form>({ fieldTypes })` so `$Infer` matches
 * the server catalog (including plugin field types) without sending `forms`
 * to the browser. `$Infer` is type-only — pass `fieldTypes` or client
 * plugins that register them for local session validation.
 *
 * TypeScript cannot infer later type parameters once a server generic is
 * set. Pass the plugin tuple as the second argument when you need literal
 * endpoint names: `createFormClient<Form, typeof plugins>({ plugins })`.
 * `createFormClient({ plugins })` without a server generic infers them.
 *
 * @example
 * ```ts
 * export type Form = typeof form;
 * export const formClient = createFormClient<Form>({ fieldTypes });
 * ```
 */
export function createFormClient<
  TServer extends FormServerLike | undefined = undefined,
  const TPlugins extends readonly FormClientPlugin[] = [],
  const TForms extends Record<string, unknown> = Record<string, unknown>,
  const TFieldTypes extends readonly FieldTypeDefinition[] =
    readonly FieldTypeDefinition[],
>(
  options: CreateFormClientOptions<TPlugins, TForms, TFieldTypes> = {},
): CreateFormClientResult<TPlugins, TForms, TFieldTypes, TServer> {
  const {
    basePath,
    baseURL,
    plugins,
    forms: _forms,
    fieldTypes: optionFieldTypes,
    validateAnswers,
    ...fetchOptions
  } = options;
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

  const applied = applyClientPlugins(plugins, { $fetch }, CORE_CLIENT_KEYS);
  const fieldTypes = [
    ...applied.fieldTypes,
    ...(optionFieldTypes ?? []),
  ] as unknown as ClientFieldTypes<TPlugins, TFieldTypes>;
  createFieldTypeRegistry(fieldTypes);
  const mergedValidateAnswers = chainAnswersValidators(
    applied.validateAnswers,
    validateAnswers,
  );

  const api: FormClientApi &
    Record<string, unknown> & {
      $fetch: FormFetch;
      baseURL: string;
      fieldTypes: ClientFieldTypes<TPlugins, TFieldTypes>;
      validateAnswers?: AnswersValidator;
      $ERROR_CODES: typeof FORM_ERROR_CODES & PluginErrorCodeMap<TPlugins>;
      $Infer: CreateFormClientResult<
        TPlugins,
        TForms,
        TFieldTypes,
        TServer
      >["$Infer"];
    } = {
    getForm(payload) {
      return get<FormSnapshot>(FORM_API_OPERATIONS.getForm.path, payload, {
        formId: payload.formId,
      });
    },
    saveForm(payload) {
      return post<FormSnapshot>(FORM_API_OPERATIONS.saveForm.path, payload);
    },
    deleteForm(payload) {
      return post<{ ok: true; formId: string }>(
        FORM_API_OPERATIONS.deleteForm.path,
        payload,
      );
    },
    listForms(payload = {}) {
      return get<FormList>(FORM_API_OPERATIONS.listForms.path, payload, {
        status: payload.status,
        limit: payload.limit,
        offset: payload.offset,
      });
    },
    startResponse(payload) {
      return post<ResponseRecord>(
        FORM_API_OPERATIONS.startResponse.path,
        payload,
      );
    },
    getResponse(payload) {
      return get<ResponseRecord>(
        FORM_API_OPERATIONS.getResponse.path,
        payload,
        {
          responseId: payload.responseId,
        },
      );
    },
    listResponses(payload = {}) {
      return get<ResponseList>(
        FORM_API_OPERATIONS.listResponses.path,
        payload,
        {
          formId: payload.formId,
          respondentId: payload.respondentId,
          status: payload.status,
          include: payload.include,
          submittedFrom: payload.submittedFrom,
          submittedTo: payload.submittedTo,
          updatedAfter: payload.updatedAfter,
          limit: payload.limit,
          offset: payload.offset,
        },
      );
    },
    saveDraft(payload) {
      return post<ResponseRecord>(FORM_API_OPERATIONS.saveDraft.path, payload);
    },
    submitResponse(payload) {
      return post<ResponseRecord>(
        FORM_API_OPERATIONS.submitResponse.path,
        payload,
      );
    },
    abandonResponse(payload) {
      return post<ResponseRecord>(
        FORM_API_OPERATIONS.abandonResponse.path,
        payload,
      );
    },
    reopenResponse(payload) {
      return post<ResponseRecord>(
        FORM_API_OPERATIONS.reopenResponse.path,
        payload,
      );
    },
    deleteResponse(payload) {
      return post<{ ok: true; responseId: string }>(
        FORM_API_OPERATIONS.deleteResponse.path,
        payload,
      );
    },
    $fetch,
    baseURL: base,
    fieldTypes,
    validateAnswers: mergedValidateAnswers,
    $ERROR_CODES: applied.errorCodes as typeof FORM_ERROR_CODES &
      PluginErrorCodeMap<TPlugins>,
    $Infer: undefined as unknown as CreateFormClientResult<
      TPlugins,
      TForms,
      TFieldTypes,
      TServer
    >["$Infer"],
    ...applied.endpoints,
  };

  return api as unknown as CreateFormClientResult<
    TPlugins,
    TForms,
    TFieldTypes,
    TServer
  >;
}
