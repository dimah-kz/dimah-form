/** Read the value returned from a plugin `init({ context })`. */
export function getPluginContext<T = unknown>(
  source: { pluginContext: ReadonlyMap<string, unknown> },
  id: string,
): T | undefined {
  return source.pluginContext.get(id) as T | undefined;
}
