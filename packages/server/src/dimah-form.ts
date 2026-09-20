import {
  chainAnswersValidators,
  createFieldTypeRegistry,
  FORM_API_BASE_PATH,
  type FORM_ERROR_CODES,
  normalizeFormApiBasePath,
  type AnswersValidator,
  type FieldTypeDefinition,
  type InferAnswersMap,
  type PluginErrorCodeMap,
  type PluginFieldTypeUnion,
} from "@dimah-form/core";
import type { Endpoint } from "better-call";

import { coreEndpoints, type CoreEndpoints } from "./api/routes";
import { createFormRouter } from "./api/router";
import { assertFormsConfig } from "./forms";
import {
  applyPlugins,
  mergeHooks,
  runPluginInits,
  type PluginEndpointMap,
} from "./plugin/apply-plugins";
import type { ResponseStore } from "./store";
import type {
  DimahFormGuard,
  DimahFormHooks,
  DimahFormMetaSchema,
  DimahFormPlugin,
  PluginInitContext,
  PluginInitResult,
  ResolvedDimahFormConfig,
} from "./types";

export type {
  DimahFormGuard,
  DimahFormHooks,
  DimahFormMetaSchema,
  DimahFormPlugin,
  PluginInitContext,
  PluginInitResult,
};

export type DimahFormConfig<
  TPlugins extends readonly DimahFormPlugin[] = readonly DimahFormPlugin[],
  TForms extends Record<string, unknown> = Record<string, unknown>,
  TFieldTypes extends readonly FieldTypeDefinition[] =
    readonly FieldTypeDefinition[],
> = {
  /** API path prefix for the HTTP `handler`. @default "/api/form" */
  basePath?: string;
  /**
   * Persistence adapter. Use `memoryAdapter()` for tests, or `db()` from
   * `@dimah-form/db`.
   */
  database: ResponseStore;
  /** Additive feature plugins. Persistence is `database`, not a plugin. */
  plugins?: TPlugins;
  /** Custom field types — validators only, not UI. Registered on this instance. */
  fieldTypes?: TFieldTypes;
  /** Code-authored forms. Dynamic forms live in the database. */
  forms?: TForms;
  /**
   * Optional schemas for the opaque `meta` bag on forms, fields, and options.
   * Protocol already requires a JSON object; these tighten the contents.
   * Plugin `metaSchema` bags run first (`dependsOn` order).
   */
  metaSchema?: DimahFormMetaSchema;
  /** Runs before every operation. Throw to reject. */
  guard?: DimahFormGuard;
  /** Domain hooks — `on*` after validation before persist; `after*` after persist. */
  hooks?: DimahFormHooks;
  /**
   * Extra answer checks after per-field validators. Same function on
   * `createFormClient({ validateAnswers })` for local session checks.
   * Plugin `validateAnswers` callbacks run first (`dependsOn` order).
   */
  validateAnswers?: AnswersValidator;
};

export type DimahForm<
  TPlugins extends readonly DimahFormPlugin[] = readonly DimahFormPlugin[],
  TForms extends Record<string, unknown> = Record<string, unknown>,
  TFieldTypes extends readonly FieldTypeDefinition[] =
    readonly FieldTypeDefinition[],
> = {
  handler: (request: Request) => Promise<Response>;
  api: CoreEndpoints & PluginEndpointMap<TPlugins>;
  $ERROR_CODES: typeof FORM_ERROR_CODES & PluginErrorCodeMap<TPlugins>;
  $Infer: {
    forms: TForms;
    answers: InferAnswersMap<
      TForms,
      readonly (PluginFieldTypeUnion<TPlugins> | TFieldTypes[number])[]
    >;
    plugins: TPlugins;
  };
};

/**
 * Create a dimah-form server instance.
 *
 * Pair with `export type Form = typeof form` and
 * `createFormClient<Form>({ fieldTypes })` so the browser client reuses
 * `$Infer` without a runtime catalog copy. Pass the same `fieldTypes` (or
 * client plugins that register them) for local session validation.
 *
 * Submit validates against the definition snapshot taken at start, not the
 * live questionnaire in {@link DimahFormConfig.forms}.
 */
export function dimahForm<
  const TPlugins extends readonly DimahFormPlugin[] = [],
  const TForms extends Record<string, unknown> = Record<string, unknown>,
  const TFieldTypes extends readonly FieldTypeDefinition[] = [],
>(
  config: DimahFormConfig<TPlugins, TForms, TFieldTypes>,
): DimahForm<TPlugins, TForms, TFieldTypes> {
  if (config.database == null) {
    throw new Error(
      "`dimahForm()` requires `database`. Use `memoryAdapter()` from `@dimah-form/server` for tests, or `db()` from `@dimah-form/db` for persistence.",
    );
  }

  const applied = applyPlugins(config.plugins);
  const fieldTypes = createFieldTypeRegistry([
    ...applied.fieldTypes,
    ...(config.fieldTypes ?? []),
  ]);
  const forms = (config.forms ?? {}) as Record<string, unknown>;
  const metaSchemas = [
    ...applied.metaSchemas,
    ...(config.metaSchema ? [config.metaSchema] : []),
  ];
  const validateAnswers = chainAnswersValidators(
    applied.validateAnswers,
    config.validateAnswers,
  );
  assertFormsConfig(forms, fieldTypes, metaSchemas);

  const pluginMap = new Map(
    applied.plugins.map((plugin) => [plugin.id, plugin]),
  );
  const pluginContext = new Map<string, unknown>();

  const resolved: ResolvedDimahFormConfig = {
    basePath: normalizeFormApiBasePath(config.basePath ?? FORM_API_BASE_PATH),
    forms,
    guard: config.guard,
    hooks: mergeHooks(applied.hooks, config.hooks),
    database: config.database,
    fieldTypes,
    plugins: pluginMap,
    pluginContext,
    pluginOperations: applied.pluginOperations,
    metaSchemas,
    validateAnswers,
  };

  runPluginInits(applied.plugins, resolved);

  const endpoints = {
    ...coreEndpoints,
    ...applied.endpoints,
  } as Record<string, Endpoint>;

  const { handler, endpoints: api } = createFormRouter(endpoints, {
    config: resolved,
  });

  return {
    handler,
    api: api as DimahForm<TPlugins, TForms, TFieldTypes>["api"],
    $ERROR_CODES: applied.errorCodes as DimahForm<
      TPlugins,
      TForms,
      TFieldTypes
    >["$ERROR_CODES"],
    $Infer: undefined as unknown as DimahForm<
      TPlugins,
      TForms,
      TFieldTypes
    >["$Infer"],
  };
}
