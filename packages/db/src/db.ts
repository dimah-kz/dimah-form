import type { ResponseStore } from "@dimah-form/server";

import {
  createDbResponseStore,
  type DimahFormDbClient,
} from "@/store/response-store";

/**
 * FumaDB adapter — pass to `dimahForm({ database: db(client) })`.
 *
 * `client` is `DimahFormDB.client(adapter)`. A custom {@link ResponseStore}
 * goes to `dimahForm({ database })` directly.
 */
export function db(client: DimahFormDbClient): ResponseStore {
  return createDbResponseStore(client);
}
