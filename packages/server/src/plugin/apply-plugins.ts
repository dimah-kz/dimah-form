import { createMemoryResponseStore, type ResponseStore } from "@/store";
import type { DimahFormPlugin } from "@/types";

export function applyPlugins(plugins: readonly DimahFormPlugin[] | undefined): {
  store: ResponseStore;
} {
  const list = plugins ?? [];
  const seen = new Set<string>();
  let store: ResponseStore | undefined;

  for (const plugin of list) {
    if (seen.has(plugin.id)) {
      throw new Error(
        `Duplicate dimah-form plugin id "${plugin.id}". Each plugin id must be unique.`,
      );
    }
    seen.add(plugin.id);
    if (!plugin.store) continue;
    if (store) {
      throw new Error(
        "Only one plugin may provide a response store. Remove the extra `store`.",
      );
    }
    store = plugin.store;
  }

  return { store: store ?? createMemoryResponseStore() };
}
