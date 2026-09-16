import type { ResolvedDimahFormConfig } from "@/types";

/** Read the value returned from a plugin `init({ context })`. */
export function getPluginContext<T = unknown>(
  config: Pick<ResolvedDimahFormConfig, "pluginContext">,
  id: string,
): T | undefined {
  return config.pluginContext.get(id) as T | undefined;
}
