import type { Endpoint } from "better-call";

import { requestFromHeaders } from "@/helpers/request";
import type { FormEndpointContext } from "./context";

/**
 * Wrap better-call endpoints so `form.api.startResponse({ body })` injects
 * `routerContext` the same way HTTP `createRouter` does.
 */
export function bindEndpoints<E extends Record<string, Endpoint>>(
  endpoints: E,
  context: Pick<FormEndpointContext, "config">,
): E {
  const api = {} as E;

  for (const [key, endpoint] of Object.entries(endpoints)) {
    const bound = (async (input: Record<string, unknown> = {}) => {
      const headers = input.headers as HeadersInit | undefined;
      const request =
        (input.request as Request | undefined) ?? requestFromHeaders(headers);
      return endpoint({
        ...input,
        headers: headers ?? request.headers,
        request,
        context,
      });
    }) as typeof endpoint;

    bound.path = endpoint.path;
    bound.options = endpoint.options;
    api[key as keyof E] = bound as E[keyof E];
  }

  return api;
}
