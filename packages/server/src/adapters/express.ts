import { fromNodeHeaders, toNodeHandler } from "./node";
import type { DimahFormHandlerSource } from "./types";

export { fromNodeHeaders };

/**
 * Adapt a dimah-form instance to an Express / Connect handler.
 *
 * Mount **before** `express.json()` so the request body is not consumed early.
 *
 * @example
 * ```ts
 * import express from "express";
 * import { toExpressHandler } from "@dimah-form/server/express";
 * import { form } from "./form";
 *
 * const app = express();
 * app.all("/api/form/*", toExpressHandler(form));
 * app.use(express.json());
 * ```
 */
export function toExpressHandler(form: DimahFormHandlerSource) {
  return toNodeHandler(form);
}
