import type { DimahFormPlugin } from "@/types";

export function applyPlugins(
  plugins: readonly DimahFormPlugin[] | undefined,
): void {
  const list = plugins ?? [];
  const seen = new Set<string>();

  for (const plugin of list) {
    if (seen.has(plugin.id)) {
      throw new Error(
        `Duplicate dimah-form plugin id "${plugin.id}". Each plugin id must be unique.`,
      );
    }
    seen.add(plugin.id);
  }
}
