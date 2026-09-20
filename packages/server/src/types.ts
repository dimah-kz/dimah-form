import type { Endpoint } from "better-call";
import type {
  AnswersValidator,
  AppliedMetaSchema,
  ErrorCodeCatalog,
  FieldTypeDefinition,
  FormApiOperation,
  FormDefinitionMeta,
  FormDefinitionMetaSchema,
  FormSnapshot,
  MaybePromise,
  ResponseRecord,
} from "@dimah-form/core";

import type { ResponseStore } from "./store";

/** Core operations plus plugin-defined strings. */
export type FormOperation = FormApiOperation | (string & {});

export type DimahFormGuard = (context: {
  request: Request;
  operation: FormOperation;
  formId?: string;
  responseId?: string;
  /** Store read — no HTTP and no guard re-entry. */
  getResponse: (responseId: string) => MaybePromise<ResponseRecord | undefined>;
  /** Code-authored catalog first, then `database.getForm`. */
  getForm: (idOrSlug: string) => MaybePromise<FormSnapshot | undefined>;
}) => MaybePromise<void>;

type ResponseHookContext = {
  request: Request;
  response: ResponseRecord;
};

type FormHookContext = {
  request: Request;
  form: FormSnapshot;
};

export type DimahFormHooks = {
  /** After validation, before persist. May set `response.respondentId`. */
  onStart?: (context: ResponseHookContext) => MaybePromise<void>;
  onSaveDraft?: (context: ResponseHookContext) => MaybePromise<void>;
  onSubmit?: (context: ResponseHookContext) => MaybePromise<void>;
  onSaveForm?: (context: FormHookContext) => MaybePromise<void>;
  onAbandon?: (context: ResponseHookContext) => MaybePromise<void>;
  onReopen?: (context: ResponseHookContext) => MaybePromise<void>;
  onDeleteResponse?: (context: ResponseHookContext) => MaybePromise<void>;
  onDeleteForm?: (context: FormHookContext) => MaybePromise<void>;
  /** After persist. Skip irreversible I/O in `on*` — use these instead. */
  afterStart?: (context: ResponseHookContext) => MaybePromise<void>;
  afterSaveDraft?: (context: ResponseHookContext) => MaybePromise<void>;
  afterSubmit?: (context: ResponseHookContext) => MaybePromise<void>;
  afterSaveForm?: (context: FormHookContext) => MaybePromise<void>;
  afterAbandon?: (context: ResponseHookContext) => MaybePromise<void>;
  afterReopen?: (context: ResponseHookContext) => MaybePromise<void>;
  afterDeleteResponse?: (context: ResponseHookContext) => MaybePromise<void>;
  afterDeleteForm?: (context: FormHookContext) => MaybePromise<void>;
};

function listedFormHookKeys<const K extends readonly (keyof DimahFormHooks)[]>(
  keys: K & (keyof DimahFormHooks extends K[number] ? unknown : never),
): K {
  return keys;
}

export const FORM_HOOK_KEYS = listedFormHookKeys([
  "onStart",
  "onSaveDraft",
  "onSubmit",
  "onSaveForm",
  "onAbandon",
  "onReopen",
  "onDeleteResponse",
  "onDeleteForm",
  "afterStart",
  "afterSaveDraft",
  "afterSubmit",
  "afterSaveForm",
  "afterAbandon",
  "afterReopen",
  "afterDeleteResponse",
  "afterDeleteForm",
]);

export type PluginInitContext = {
  id: string;
  options: unknown;
  basePath: string;
  fieldTypes: ReadonlyMap<string, FieldTypeDefinition>;
  plugins: ReadonlyMap<string, DimahFormPlugin>;
  getPluginContext: <T = unknown>(id: string) => T | undefined;
};

export type PluginInitResult = {
  /** Stored on `config.pluginContext` under this plugin's `id`. */
  context?: unknown;
};

/**
 * Additive feature plugin. Persistence is `database`, not a plugin.
 *
 * Prefer a factory that closes over options and returns {@link definePlugin}.
 *
 * @typeParam TEndpoints — better-call endpoints merged onto `form.api`.
 */
export type DimahFormPlugin<
  TEndpoints extends Record<string, Endpoint> = Record<string, Endpoint>,
> = {
  readonly id: string;
  /**
   * Other plugin ids that must be installed. Sorted before this plugin
   * (`init`, hooks, field types, endpoints, `metaSchema`, `validateAnswers`).
   */
  readonly dependsOn?: readonly string[];
  /** Factory options for sibling plugins. Prefer closures for your own config. */
  readonly options?: unknown;
  endpoints?: TEndpoints;
  hooks?: DimahFormHooks;
  fieldTypes?: readonly FieldTypeDefinition[];
  /**
   * `meta` key this plugin owns (`meta.scoring`). Unique across plugins.
   * {@link metaSchema} runs on that nested object when the key is present.
   */
  readonly metaNamespace?: string;
  /**
   * Zod checks for form / field / option `meta`. Merged in `dimahForm()`
   * (`dependsOn` order, then the instance `metaSchema`). Namespaced
   * schemas skip documents that omit the key.
   */
  metaSchema?: FormDefinitionMetaSchema;
  /**
   * Extra answer checks after per-field validators. Chained in `dependsOn`
   * order, then `dimahForm({ validateAnswers })`.
   */
  validateAnswers?: AnswersValidator;
  /**
   * Phantom authoring types for `createDefineForm({ plugins })` and
   * `FormDefinitionUi<typeof fieldTypes, typeof plugins>`. Prefer
   * `NamespacedMeta` so keys sit under `meta.scoring` (and similar).
   */
  readonly $Meta?: FormDefinitionMeta;
  /**
   * Plugin error catalog. Merged onto `form.$ERROR_CODES`. Cannot shadow
   * core or another plugin's codes. Share the same module with the client plugin.
   */
  $ERROR_CODES?: ErrorCodeCatalog;
  /**
   * Runs once in `dimahForm()`, after plugins are sorted and the registry
   * exists. Must be synchronous. Return `{ context }` for request handlers.
   */
  init?: (ctx: PluginInitContext) => PluginInitResult | void;
};

/** Optional Zod schemas for the opaque `meta` bag. Applied at init / `saveForm`. */
export type DimahFormMetaSchema = FormDefinitionMetaSchema;

export type ResolvedDimahFormConfig = {
  basePath: string;
  /** Live catalog — read on get/start, not copied at init. */
  forms: Record<string, unknown>;
  guard?: DimahFormGuard;
  hooks: DimahFormHooks;
  database: ResponseStore;
  fieldTypes: ReadonlyMap<string, FieldTypeDefinition>;
  plugins: ReadonlyMap<string, DimahFormPlugin>;
  pluginContext: ReadonlyMap<string, unknown>;
  /**
   * Plugin route key (`"GET /ping"`) → `endpoints` object key (`"ping"`).
   * Guard uses this when `metadata.operation` is omitted.
   */
  pluginOperations: ReadonlyMap<string, string>;
  metaSchemas: readonly AppliedMetaSchema[];
  validateAnswers?: AnswersValidator;
};
