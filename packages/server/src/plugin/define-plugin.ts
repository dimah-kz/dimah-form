import type { DimahFormPlugin } from "@/types";

export function definePlugin<const T extends DimahFormPlugin>(plugin: T): T {
  return plugin;
}
