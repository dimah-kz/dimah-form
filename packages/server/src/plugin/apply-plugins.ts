import {
  FORM_API_ROUTE_KEYS,
  formApiRouteKey,
  type FieldTypeDefinition,
} from "@dimah-form/core";
import type { Endpoint } from "better-call";

import { CORE_ENDPOINT_NAMES } from "@/api/routes";
import {
  FORM_HOOK_KEYS,
  type DimahFormHooks,
  type DimahFormPlugin,
} from "@/types";

export const RESERVED_PLUGIN_IDS = [
  "handler",
  "api",
  "$ERROR_CODES",
  "$Infer",
] as const;

type UnionToIntersection<U> = (
  U extends unknown ? (k: U) => void : never
) extends (k: infer I) => void
  ? I
  : Record<string, never>;

/** Map plugin endpoint names → better-call endpoints. */
export type PluginEndpointMap<P extends readonly DimahFormPlugin[]> =
  P extends readonly []
    ? Record<string, never>
    : UnionToIntersection<
        P[number] extends { endpoints?: infer E }
          ? E extends Record<string, Endpoint>
            ? E
            : Record<string, never>
          : Record<string, never>
      >;

export type AppliedPlugins = {
  endpoints: Record<string, Endpoint>;
  fieldTypes: FieldTypeDefinition[];
  hooks: DimahFormHooks;
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

export function mergeHookBags(bags: DimahFormHooks[]): DimahFormHooks {
  return Object.fromEntries(
    FORM_HOOK_KEYS.map((key) => [
      key,
      chainHooks(...bags.map((bag) => bag[key] as never)),
    ]),
  ) as DimahFormHooks;
}

/**
 * Validate plugins, collect endpoints / field types, and chain plugin hooks.
 * User config hooks are chained afterwards in `dimahForm()`.
 */
export function applyPlugins(
  plugins: readonly DimahFormPlugin[] | undefined,
): AppliedPlugins {
  const list = plugins ?? [];
  const seen = new Set<string>();
  const endpoints: Record<string, Endpoint> = {};
  const fieldTypes: FieldTypeDefinition[] = [];
  const hookBags: DimahFormHooks[] = [];
  const seenRoutes = new Set<string>(Object.keys(FORM_API_ROUTE_KEYS));
  const reservedNames = new Set<string>(CORE_ENDPOINT_NAMES);

  for (const plugin of list) {
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

    if (plugin.fieldTypes) {
      fieldTypes.push(...plugin.fieldTypes);
    }
    if (plugin.hooks) {
      hookBags.push(plugin.hooks);
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
      endpoints[name] = endpoint;
    }
  }

  return {
    endpoints,
    fieldTypes,
    hooks: mergeHookBags(hookBags),
  };
}

export function mergeHooks(
  pluginHooks: DimahFormHooks,
  userHooks: DimahFormHooks | undefined,
): DimahFormHooks {
  return mergeHookBags(userHooks ? [pluginHooks, userHooks] : [pluginHooks]);
}
