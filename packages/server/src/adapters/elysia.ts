import type { DimahFormHandlerSource } from "./types";

/** Structural Elysia context — avoids a hard dependency on `elysia`. */
type ElysiaContext = {
  request: Request;
};

/**
 * Adapt a dimah-form instance to an Elysia route handler.
 *
 * @example
 * ```ts
 * import { Elysia } from "elysia";
 * import { toElysiaHandler } from "@dimah-form/server/elysia";
 * import { form } from "./form";
 *
 * new Elysia()
 *   .all("/api/form/*", toElysiaHandler(form))
 *   .listen(3000);
 * ```
 */
export function toElysiaHandler(form: DimahFormHandlerSource) {
  return (ctx: ElysiaContext) => form.handler(ctx.request);
}
