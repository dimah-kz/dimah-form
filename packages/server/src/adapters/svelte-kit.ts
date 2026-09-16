import type { DimahFormHandlerSource } from "./types";

/** Structural SvelteKit event — avoids a hard dependency on `@sveltejs/kit`. */
type SvelteKitRequestEvent = {
  request: Request;
};

/**
 * Adapt a dimah-form instance to a SvelteKit request handler.
 *
 * @example
 * ```ts
 * // src/routes/api/form/[...path]/+server.ts
 * import { toSvelteKitHandler } from "@dimah-form/server/svelte-kit";
 * import { form } from "$lib/form";
 *
 * const handler = toSvelteKitHandler(form);
 * export const GET = handler;
 * export const POST = handler;
 * export const PUT = handler;
 * export const PATCH = handler;
 * export const DELETE = handler;
 * ```
 */
export function toSvelteKitHandler(form: DimahFormHandlerSource) {
  return (event: SvelteKitRequestEvent) => form.handler(event.request);
}
