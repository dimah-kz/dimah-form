import type { ResponseStore } from "@dimah-form/server";

import {
  resolveResponseStore,
  type DimahFormDbClient,
} from "@/store/response-store";

/**
 * FumaDB adapter — pass to `dimahForm({ database: db(client) })`.
 *
 * `client` is `DimahFormDB.client(adapter)` or a prebuilt {@link ResponseStore}.
 */
export function db(client: DimahFormDbClient | ResponseStore): ResponseStore {
  return resolveResponseStore(client);
}
