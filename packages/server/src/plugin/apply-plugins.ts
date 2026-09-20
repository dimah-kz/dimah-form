import {
  assertMetaNamespace,
  assertPluginId,
  builtinFieldTypes,
  chainAnswersValidators,
  FORM_API_ROUTE_KEYS,
  formApiRouteKey,
  mergeErrorCodes,
  sortPluginsByDependsOn,
  type AnswersValidator,
  type AppliedMetaSchema,
  type ErrorCodeCatalog,
  type FieldTypeDefinition,
  type IntersectDefined,
} from "@dimah-form/core";
import type { Endpoint } from "better-call";

import { CORE_ENDPOINT_NAMES } from "@/api/routes";
import {
  FORM_HOOK_KEYS,
  type DefinitionValidator,
  type DimahFormHooks,
  type DimahFormPlugin,
  type ResolvedDimahFormConfig,
} from "@/types";

export const RESERVED_PLUGIN_IDS = [
  "handler",
  "api",
  "$ERROR_CODES",
  "$Infer",
] as const;

type EndpointsOf<P> = P extends { endpoints: infer E }
  ? E extends Record<string, Endpoint>
    ? E
    : never
  : never;

/** Map plugin endpoint names → better-call endpoints. */
export type PluginEndpointMap<P extends readonly DimahFormPlugin[]> = [
  P,
] extends [readonly []]
  ? Record<string, never>
  : IntersectDefined<EndpointsOf<P[number]>>;

export type AppliedPlugins = {
  plugins: DimahFormPlugin[];
  endpoints: Record<string, Endpoint>;
  fieldTypes: FieldTypeDefinition[];
  hooks: DimahFormHooks;
  errorCodes: ErrorCodeCatalog;
  pluginOperations: Map<string, string>;
  metaSchemas: AppliedMetaSchema[];
  validateAnswers?: AnswersValidator;
  validateDefinition?: DefinitionValidator;
};

function routeKey(endpoint: Endpoint) {
  return formApiRouteKey(String(endpoint.options.method), endpoint.path);
}

function chainHooks<Context>(
  ...hooks: (((context: Context) => Promise<void> | void) | undefined)[]
): ((context: Context) => Promise<void>) | undefined {
  const present = hooks.filter(
    (hook): hook is (context: Context) => Promise<void> | void => hook != null,
  );
  if (present.length === 0) return undefined;
  return async (context) => {
    for (const hook of present) {
      await hook(context);
    }
  };
}

function chainDefinitionValidators(
  ...validators: (DefinitionValidator | undefined)[]
): DefinitionValidator | undefined {
  const present = validators.filter(
    (validator): validator is DefinitionValidator => validator != null,
  );
  if (present.length === 0) return undefined;
  if (present.length === 1) return present[0];
  return (form) => {
    const issues: NonNullable<ReturnType<DefinitionValidator>> = [];
    for (const validator of present) {
      const extra = validator(form);
      if (extra) {
        for (const item of extra) issues.push(item);
      }
    }
    return issues.length > 0 ? issues : undefined;
  };
}

export function mergeDefinitionValidators(
  pluginValidator: DefinitionValidator | undefined,
  userValidator: DefinitionValidator | undefined,
): DefinitionValidator | undefined {
  return chainDefinitionValidators(pluginValidator, userValidator);
}

export function mergeHookBags(bags: DimahFormHooks[]): DimahFormHooks {
  return Object.fromEntries(
    FORM_HOOK_KEYS.map((key) => [
      key,
      chainHooks(...bags.map((bag) => bag[key] as never)),
    ]),
  );
}

const builtinTypeNames = new Set<string>(
  builtinFieldTypes.map((fieldType) => fieldType.type),
);

/**
 * Validate plugins, honor `dependsOn`, collect endpoints / field types /
 * error codes / meta schemas, and chain plugin hooks and `validateAnswers`.
 * User config hooks / `validateAnswers` / `validateDefinition` /
 * `metaSchema` are chained afterwards in `dimahForm()`.
 */
export function applyPlugins(
  plugins: readonly DimahFormPlugin[] | undefined,
): AppliedPlugins {
  const list = plugins ?? [];
  const seen = new Set<string>();

  for (const plugin of list) {
    assertPluginId(plugin.id, "plugin");
    if ((RESERVED_PLUGIN_IDS as readonly string[]).includes(plugin.id)) {
      throw new Error(
        `dimah-form plugin id "${plugin.id}" is reserved on the instance.`,
      );
    }
    if (seen.has(plugin.id)) {
      throw new Error(
        `Duplicate dimah-form plugin id "${plugin.id}". Each plugin id must be unique.`,
      );
    }
    seen.add(plugin.id);
  }

  const sorted = sortPluginsByDependsOn(list, "plugin");
  const endpoints: Record<string, Endpoint> = {};
  const fieldTypes: FieldTypeDefinition[] = [];
  const hookBags: DimahFormHooks[] = [];
  const seenRoutes = new Set<string>(Object.keys(FORM_API_ROUTE_KEYS));
  const reservedNames = new Set<string>(CORE_ENDPOINT_NAMES);
  const pluginOperations = new Map<string, string>();
  const typeOwner = new Map<string, string>();
  const namespaceOwner = new Map<string, string>();
  const metaSchemas: AppliedMetaSchema[] = [];
  const validators: AnswersValidator[] = [];
  const definitionValidators: DefinitionValidator[] = [];

  for (const plugin of sorted) {
    if (plugin.hooks) {
      hookBags.push(plugin.hooks);
    }
    if (plugin.validateAnswers) {
      validators.push(plugin.validateAnswers);
    }
    if (plugin.validateDefinition) {
      definitionValidators.push(plugin.validateDefinition);
    }

    let namespace: string | undefined;
    if (plugin.metaNamespace !== undefined) {
      namespace = assertMetaNamespace(
        plugin.metaNamespace,
        plugin.id,
        "plugin",
      );
      const owner = namespaceOwner.get(namespace);
      if (owner) {
        throw new Error(
          `Duplicate dimah-form meta namespace "${namespace}". Plugin "${plugin.id}" conflicts with plugin "${owner}".`,
        );
      }
      namespaceOwner.set(namespace, plugin.id);
    }

    if (plugin.metaSchema) {
      metaSchemas.push(
        namespace
          ? { ...plugin.metaSchema, namespace }
          : { ...plugin.metaSchema },
      );
    }

    for (const fieldType of plugin.fieldTypes ?? []) {
      if (builtinTypeNames.has(fieldType.type)) {
        throw new Error(
          `Duplicate dimah-form field type "${fieldType.type}". Plugin "${plugin.id}" conflicts with a built-in type.`,
        );
      }
      const owner = typeOwner.get(fieldType.type);
      if (owner) {
        throw new Error(
          `Duplicate dimah-form field type "${fieldType.type}". Plugin "${plugin.id}" conflicts with plugin "${owner}".`,
        );
      }
      typeOwner.set(fieldType.type, plugin.id);
      fieldTypes.push(fieldType);
    }

    for (const [name, endpoint] of Object.entries(plugin.endpoints ?? {})) {
      if (reservedNames.has(name) || name in endpoints) {
        throw new Error(
          `Duplicate dimah-form endpoint "${name}". Plugin "${plugin.id}" conflicts with a core or plugin route.`,
        );
      }
      const key = routeKey(endpoint);
      if (seenRoutes.has(key)) {
        throw new Error(
          `Duplicate dimah-form route ${key}. Plugin "${plugin.id}" conflicts with a core or plugin route.`,
        );
      }
      seenRoutes.add(key);
      reservedNames.add(name);
      pluginOperations.set(key, name);
      endpoints[name] = endpoint;
    }
  }

  return {
    plugins: sorted,
    endpoints,
    fieldTypes,
    hooks: mergeHookBags(hookBags),
    errorCodes: mergeErrorCodes(sorted, "plugin"),
    pluginOperations,
    metaSchemas,
    validateAnswers: chainAnswersValidators(...validators),
    validateDefinition: chainDefinitionValidators(...definitionValidators),
  };
}

export function mergeHooks(
  pluginHooks: DimahFormHooks,
  userHooks: DimahFormHooks | undefined,
): DimahFormHooks {
  return mergeHookBags(userHooks ? [pluginHooks, userHooks] : [pluginHooks]);
}

/**
 * Run each plugin `init` in `dependsOn` order. Must be synchronous.
 */
export function runPluginInits(
  plugins: readonly DimahFormPlugin[],
  config: ResolvedDimahFormConfig,
): void {
  for (const plugin of plugins) {
    const result = plugin.init?.({
      id: plugin.id,
      options: plugin.options,
      basePath: config.basePath,
      fieldTypes: config.fieldTypes,
      plugins: config.plugins,
      getPluginContext: <T = unknown>(id: string) =>
        config.pluginContext.get(id) as T | undefined,
    });
    if (result instanceof Promise) {
      throw new TypeError(
        `dimah-form plugin "${plugin.id}" init() must be synchronous.`,
      );
    }
    const context = result?.context;
    if (context !== undefined) {
      (config.pluginContext as Map<string, unknown>).set(plugin.id, context);
    }
  }
}
