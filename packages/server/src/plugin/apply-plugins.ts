import {
  FORM_API_ROUTE_KEYS,
  formApiRouteKey,
  type FieldTypeDefinition,
} from "@dimah-form/core";
import type { Endpoint } from "better-call";

import { CORE_ENDPOINT_NAMES } from "@/api/routes";
import type { DimahFormHooks, DimahFormPlugin } from "@/types";

import { chainHooks } from "./chain-hooks";

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

export function mergeHookBags(bags: DimahFormHooks[]): DimahFormHooks {
  return {
    onStart: chainHooks(...bags.map((bag) => bag.onStart)),
    onSaveDraft: chainHooks(...bags.map((bag) => bag.onSaveDraft)),
    onSubmit: chainHooks(...bags.map((bag) => bag.onSubmit)),
    onSaveForm: chainHooks(...bags.map((bag) => bag.onSaveForm)),
    onAbandon: chainHooks(...bags.map((bag) => bag.onAbandon)),
    onDeleteResponse: chainHooks(...bags.map((bag) => bag.onDeleteResponse)),
    onDeleteForm: chainHooks(...bags.map((bag) => bag.onDeleteForm)),
    afterStart: chainHooks(...bags.map((bag) => bag.afterStart)),
    afterSaveDraft: chainHooks(...bags.map((bag) => bag.afterSaveDraft)),
    afterSubmit: chainHooks(...bags.map((bag) => bag.afterSubmit)),
    afterSaveForm: chainHooks(...bags.map((bag) => bag.afterSaveForm)),
    afterAbandon: chainHooks(...bags.map((bag) => bag.afterAbandon)),
    afterDeleteResponse: chainHooks(
      ...bags.map((bag) => bag.afterDeleteResponse),
    ),
    afterDeleteForm: chainHooks(...bags.map((bag) => bag.afterDeleteForm)),
  };
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
