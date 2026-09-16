import type { FormFetch } from "../create-form-fetch";
import type { ErrorCodeCatalog } from "../error-codes";
import {
  RESERVED_CLIENT_PLUGIN_IDS,
  type FormClientPlugin,
} from "../client-plugin";
import { mergeErrorCodes } from "./merge-error-codes";
import { assertPluginId, sortPluginsByDependsOn } from "./sort-plugins";

export type AppliedClientPlugins = {
  endpoints: Record<string, (...args: never[]) => unknown>;
  errorCodes: ErrorCodeCatalog;
};

/**
 * Validate client plugins, honor `dependsOn`, merge error catalogs, and
 * collect extra client methods.
 */
export function applyClientPlugins(
  plugins: readonly FormClientPlugin[] | undefined,
  ctx: { $fetch: FormFetch },
  reservedEndpointNames: ReadonlySet<string>,
): AppliedClientPlugins {
  const list = plugins ?? [];
  const seen = new Set<string>();

  for (const plugin of list) {
    assertPluginId(plugin.id, "client plugin");
    if ((RESERVED_CLIENT_PLUGIN_IDS as readonly string[]).includes(plugin.id)) {
      throw new Error(
        `dimah-form client plugin id "${plugin.id}" is reserved on the client.`,
      );
    }
    if (seen.has(plugin.id)) {
      throw new Error(
        `Duplicate dimah-form client plugin id "${plugin.id}". Each plugin id must be unique.`,
      );
    }
    seen.add(plugin.id);
  }

  const sorted = sortPluginsByDependsOn(list, "client plugin");
  const endpoints: Record<string, (...args: never[]) => unknown> = {};

  for (const plugin of sorted) {
    const extra = plugin.endpoints?.(ctx) ?? {};
    for (const [name, fn] of Object.entries(extra)) {
      if (reservedEndpointNames.has(name) || name in endpoints) {
        throw new Error(
          `Duplicate dimah-form client endpoint "${name}". Plugin "${plugin.id}" conflicts with a core or plugin method.`,
        );
      }
      endpoints[name] = fn;
    }
  }

  return {
    endpoints,
    errorCodes: mergeErrorCodes(sorted, "client plugin"),
  };
}
