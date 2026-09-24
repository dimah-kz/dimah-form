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
  ValidationIssue,
} from "@dimah-form/core";

import type { ResponseStore } from "./store";

/** Core operations plus plugin-defined strings. */
export type FormOperation = FormApiOperation | (string & {});

/**
 * Argument to `dimahForm({ guard })`. Runs before form logic.
 * Throw an `APIError` to reject the request.
 */
export type DimahFormGuardContext = {
  request: Request;
  /** Core operation, or the plugin endpoint key. */
  operation: FormOperation;
  formId?: string;
  responseId?: string;
  /** Store read — no HTTP and no guard re-entry. */
  getResponse: (responseId: string) => MaybePromise<ResponseRecord | undefined>;
  /** Code-authored catalog first, then `database.getForm`. */
  getForm: (idOrSlug: string) => MaybePromise<FormSnapshot | undefined>;
};

export type DimahFormGuard = (
  context: DimahFormGuardContext,
) => MaybePromise<void>;

type PluginContextLookup = <T = unknown>(id: string) => T | undefined;

/** `on*` / `after*` context for a response write. */
export type ResponseHookContext = {
  request: Request;
  /** Mutable until persist. Set `respondentId` here — do not trust the browser. */
  response: ResponseRecord;
  /** Context returned from a plugin `init`. */
  getPluginContext: PluginContextLookup;
};

/** `onSaveForm` / `onDeleteForm` context. */
export type FormHookContext = {
  request: Request;
  form: FormSnapshot;
  /** Context returned from a plugin `init`. */
  getPluginContext: PluginContextLookup;
};

/**
 * Domain hooks. `on*` runs after validation and before persist — throwing
 * aborts the write. `after*` runs after a successful write.
 */
export type DimahFormHooks = {
  /** Before the response row is inserted. May set `response.respondentId`. */
  onStart?: (context: ResponseHookContext) => MaybePromise<void>;
  /** Before a draft patch is stored. */
  onSaveDraft?: (context: ResponseHookContext) => MaybePromise<void>;
  /** Before status becomes `"submitted"`. */
  onSubmit?: (context: ResponseHookContext) => MaybePromise<void>;
  /** Before a live questionnaire upsert. */
  onSaveForm?: (context: FormHookContext) => MaybePromise<void>;
  /** Before an unfinished response is locked as `"abandoned"`. */
  onAbandon?: (context: ResponseHookContext) => MaybePromise<void>;
  /** Before a locked response returns to `"draft"`. */
  onReopen?: (context: ResponseHookContext) => MaybePromise<void>;
  /** Before a response row is deleted. */
  onDeleteResponse?: (context: ResponseHookContext) => MaybePromise<void>;
  /** Before a database questionnaire is deleted. */
  onDeleteForm?: (context: FormHookContext) => MaybePromise<void>;
  /** After the response row is inserted. Side effects belong here. */
  afterStart?: (context: ResponseHookContext) => MaybePromise<void>;
  /** After the draft patch is stored. */
  afterSaveDraft?: (context: ResponseHookContext) => MaybePromise<void>;
  /** After submit persist. A throw still fails the HTTP response. */
  afterSubmit?: (context: ResponseHookContext) => MaybePromise<void>;
  /** After the live questionnaire is stored. */
  afterSaveForm?: (context: FormHookContext) => MaybePromise<void>;
  /** After the response is locked as `"abandoned"`. */
  afterAbandon?: (context: ResponseHookContext) => MaybePromise<void>;
  /** After the response returns to `"draft"`. */
  afterReopen?: (context: ResponseHookContext) => MaybePromise<void>;
  /** After the response row is deleted. */
  afterDeleteResponse?: (context: ResponseHookContext) => MaybePromise<void>;
  /** After the database questionnaire is deleted. */
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
 * Whole-document checks after per-bag `metaSchema`. Synchronous on purpose
 * (`dimahForm()` init cannot be async). Used for cross-field plugin rules
 * (e.g. `meta.scoring` variable refs). Not answer validation.
 */
export type DefinitionValidator = (form: {
  meta?: unknown;
  fields: readonly Record<string, unknown>[];
}) => ValidationIssue[] | void;

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
   * (`init`, hooks, field types, endpoints, `metaSchema`, `validateAnswers`,
   * `validateDefinition`).
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
   * Whole-document checks after namespaced `metaSchema`. Chained in
   * `dependsOn` order, then `dimahForm({ validateDefinition })`. Runs at
   * init, `saveForm`, and live form reads (`getForm` / `listForms` /
   * `startResponse`). Response snapshots are not re-checked. Must be
   * synchronous.
   */
  validateDefinition?: DefinitionValidator;
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
  validateDefinition?: DefinitionValidator;
};
