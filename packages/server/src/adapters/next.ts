import type { DimahFormHandlerSource } from "./types";

export type { DimahFormHandlerSource };

/**
 * Adapt a dimah-form instance to Next.js App Router route handlers.
 *
 * @example
 * ```ts
 * import { toNextJsHandler } from "@dimah-form/server/next";
 * import { form } from "@/lib/form";
 *
 * export const { GET, POST, PUT, PATCH, DELETE } = toNextJsHandler(form);
 * ```
 */
export function toNextJsHandler(form: DimahFormHandlerSource) {
  return {
    GET: form.handler,
    POST: form.handler,
    PUT: form.handler,
    PATCH: form.handler,
    DELETE: form.handler,
  };
}
