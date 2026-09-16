import type { ResolvedDimahFormConfig } from "@/types";

/**
 * Injected on every {@link createFormEndpoint} via better-call `routerContext`
 * (HTTP) and bindEndpoints (direct `form.api` calls).
 */
export type FormEndpointContext = {
  config: ResolvedDimahFormConfig;
  request: Request;
};
