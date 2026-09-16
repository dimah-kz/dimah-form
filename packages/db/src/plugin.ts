import type { DimahFormPlugin } from "@dimah-form/server";

export type DbPluginOptions = {
  /** `DimahFormDB.client(adapter)` */
  client: unknown;
};

/** Optional persistence plugin — merge in `dimahForm({ plugins: [db()] })`. */
export function db(_options: DbPluginOptions): DimahFormPlugin {
  return { id: "db" };
}
