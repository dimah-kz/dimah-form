import type { FormFetch } from "./create-form-fetch";
import type { FieldTypeDefinition } from "./define";
import type { ErrorCodeCatalog } from "./error-codes";
import type { IntersectDefined } from "./plugin/types";

/**
 * Browser companion to a server plugin. Same `id` as the server plugin.
 * Merge onto `createFormClient({ plugins })` — never copy core route strings,
 * and never infer this from the server instance.
 */
export type FormClientPlugin<
  TEndpoints extends Record<string, (...args: never[]) => unknown> = Record<
    string,
    (...args: never[]) => unknown
  >,
> = {
  readonly id: string;
  /**
   * Other client plugin ids that must be installed. Sorted before this
   * plugin (hooks / `init` on the server; endpoint merge order here).
   */
  readonly dependsOn?: readonly string[];
  /** Factory options for sibling plugins. Prefer closures for your own config. */
  readonly options?: unknown;
  /** Extra `client.api` methods. Receive the typed protocol `$fetch`. */
  endpoints?: (ctx: { $fetch: FormFetch }) => TEndpoints;
  /**
   * Custom field types for local session validation and `formatAnswer`.
   * Pass the same definitions as the matching server plugin.
   */
  fieldTypes?: readonly FieldTypeDefinition[];
  /**
   * Plugin error catalog — same module as the server plugin. Merged onto
   * `client.$ERROR_CODES`. Cannot shadow core or another plugin's codes.
   */
  $ERROR_CODES?: ErrorCodeCatalog;
};

type ClientEndpointsOf<P> = P extends {
  endpoints: (ctx: { $fetch: FormFetch }) => infer E;
}
  ? E extends Record<string, (...args: never[]) => unknown>
    ? E
    : never
  : never;

export type ClientPluginEndpointMap<P extends readonly FormClientPlugin[]> = [
  P,
] extends [readonly []]
  ? Record<string, never>
  : IntersectDefined<ClientEndpointsOf<P[number]>>;

export const RESERVED_CLIENT_PLUGIN_IDS = [
  "$fetch",
  "baseURL",
  "$ERROR_CODES",
  "$Infer",
  "fieldTypes",
] as const;

/**
 * Identity helper so factories keep literal `id` / endpoint / catalog types.
 *
 * @example
 * ```ts
 * export const pingClient = () =>
 *   defineClientPlugin({
 *     id: "ping",
 *     endpoints: ({ $fetch }) => ({
 *       ping: () => $fetch<{ ok: true }>("/ping", { method: "GET" }),
 *     }),
 *   });
 * ```
 */
export function defineClientPlugin<const T extends FormClientPlugin>(
  plugin: T,
): T {
  return plugin;
}
