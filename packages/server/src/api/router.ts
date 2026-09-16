import { createRouter, toResponse, type Endpoint } from "better-call";
import {
  FORM_API_BASE_PATH,
  isAPIError,
  normalizeFormApiBasePath,
} from "@dimah-form/core";

import { errors } from "@/errors";
import type { ResolvedDimahFormConfig } from "@/types";
import { bindEndpoints } from "./bind-endpoints";

/**
 * better-call `onError`: `APIError` serializes natively. Unknown throws
 * become INTERNAL_ERROR.
 */
function onFormRouterError(error: unknown): void {
  if (isAPIError(error)) return;
  throw errors.internalError();
}

/**
 * Unmatched routes never hit `onError` — better-call returns an empty 404.
 * Re-serialize those as APIError JSON. JSON 404s from endpoints pass through.
 */
function withUnmatchedRouteJson(
  handler: (request: Request) => Promise<Response>,
): (request: Request) => Promise<Response> {
  return async (request) => {
    const response = await handler(request);
    if (response.status !== 404) return response;
    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) return response;
    return toResponse(errors.notFound());
  };
}

/**
 * Internal better-call router. Not part of the public package surface.
 */
export function createFormRouter<E extends Record<string, Endpoint>>(
  endpoints: E,
  env: { config: ResolvedDimahFormConfig },
) {
  const basePath = normalizeFormApiBasePath(
    env.config.basePath ?? FORM_API_BASE_PATH,
  );

  const router = createRouter(endpoints, {
    basePath,
    routerContext: { config: env.config },
    openapi: { disabled: true },
    onError: onFormRouterError,
  });

  return {
    endpoints: bindEndpoints(router.endpoints, { config: env.config }),
    handler: withUnmatchedRouteJson(router.handler),
  };
}
