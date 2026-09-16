import type { DimahFormPlugin } from "@/types";

/**
 * Identity helper so plugin factories keep literal `id` / endpoint / catalog types.
 *
 * @example
 * ```ts
 * export const ping = (options?: { token?: string }) =>
 *   definePlugin({
 *     id: "ping",
 *     options,
 *     $ERROR_CODES: defineErrorCodes({ PING_FAILED: "Ping failed" }),
 *     endpoints: {
 *       ping: createFormEndpoint("/ping", { method: "GET" }, async () => ({
 *         ok: true,
 *       })),
 *     },
 *   });
 * ```
 */
export function definePlugin<const T extends DimahFormPlugin>(plugin: T): T {
  return plugin;
}
