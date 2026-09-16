import type { PluginIdentity } from "./types";

export function assertPluginId(
  id: unknown,
  label: "plugin" | "client plugin",
): asserts id is string {
  if (typeof id !== "string" || id.trim() === "") {
    throw new Error(`dimah-form ${label} id must be a non-empty string.`);
  }
}

/**
 * Stable topological sort: `dependsOn` first, original array order as a
 * tie-break. Missing deps and cycles throw.
 */
export function sortPluginsByDependsOn<T extends PluginIdentity>(
  plugins: readonly T[],
  label: "plugin" | "client plugin",
): T[] {
  const ids = new Set(plugins.map((plugin) => plugin.id));

  for (const plugin of plugins) {
    for (const dep of plugin.dependsOn ?? []) {
      if (dep === plugin.id) {
        throw new Error(
          `dimah-form ${label} "${plugin.id}" cannot depend on itself.`,
        );
      }
      if (!ids.has(dep)) {
        throw new Error(
          `dimah-form ${label} "${plugin.id}" depends on "${dep}", which is not installed.`,
        );
      }
    }
  }

  const remaining = new Map(
    plugins.map((plugin) => [plugin.id, new Set(plugin.dependsOn ?? [])]),
  );
  const pending = new Set(plugins.map((plugin) => plugin.id));
  const sorted: T[] = [];

  while (pending.size > 0) {
    const next = plugins.find(
      (plugin) =>
        pending.has(plugin.id) && remaining.get(plugin.id)?.size === 0,
    );
    if (!next) {
      throw new Error(
        `dimah-form ${label} cycle involving ${[...pending].map((id) => `"${id}"`).join(", ")}.`,
      );
    }
    sorted.push(next);
    pending.delete(next.id);
    for (const deps of remaining.values()) {
      deps.delete(next.id);
    }
  }

  return sorted;
}
