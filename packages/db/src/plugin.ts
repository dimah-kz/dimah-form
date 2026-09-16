import type { DimahFormPlugin, ResponseStore } from "@dimah-form/server";

import {
  resolveResponseStore,
  type DimahFormDbClient,
} from "@/store/response-store";

export type DbPluginOptions = {
  /** `DimahFormDB.client(adapter)` or a prebuilt {@link ResponseStore}. */
  client: DimahFormDbClient | ResponseStore;
};

/** Optional persistence plugin — merge in `dimahForm({ plugins: [db()] })`. */
export function db(options: DbPluginOptions): DimahFormPlugin {
  return {
    id: "db",
    store: resolveResponseStore(options.client),
  };
}
