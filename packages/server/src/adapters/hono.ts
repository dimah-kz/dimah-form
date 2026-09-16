import type { DimahFormHandlerSource } from "./types";

/** Structural Hono context — avoids a hard dependency on `hono`. */
type HonoContext = {
  req: { raw: Request };
};

/**
 * Adapt a dimah-form instance to a Hono route handler.
 *
 * @example
 * ```ts
 * import { Hono } from "hono";
 * import { toHonoHandler } from "@dimah-form/server/hono";
 * import { form } from "./form";
 *
 * const app = new Hono();
 * app.on(["GET", "POST", "PUT", "PATCH", "DELETE"], "/api/form/*", toHonoHandler(form));
 * ```
 */
export function toHonoHandler(form: DimahFormHandlerSource) {
  return (c: HonoContext) => form.handler(c.req.raw);
}
