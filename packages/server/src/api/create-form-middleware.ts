import { createMiddleware } from "better-call";

import { requestFromHeaders } from "@/helpers/request";
import type { FormEndpointContext } from "./context";

/**
 * Injects `config` / `request` and runs the global `guard`.
 * Used by {@link createFormEndpoint} so HTTP and `form.api` share the same path.
 */
export const formContextMiddleware = createMiddleware(async (ctx) => {
  const injected = ctx.context as Partial<FormEndpointContext> | undefined;
  if (!injected?.config) {
    throw new Error(
      "createFormEndpoint requires dimahForm router context. Call endpoints through dimahForm().api or the HTTP handler.",
    );
  }

  const request =
    ctx.request ??
    injected.request ??
    requestFromHeaders(ctx.headers as HeadersInit | undefined);

  await injected.config.guard?.({ request });

  return {
    config: injected.config,
    request,
  } satisfies FormEndpointContext;
});
