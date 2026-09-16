import { createFetch, type BetterFetch } from "@better-fetch/fetch";

import { APIError } from "./error";
import { formFetchErrorSchema } from "./schema/error";

export type FormFetch = BetterFetch<{ throw: true }>;

export type FormClientFetchOptions = {
  /** Defaults to global `fetch` — override for SSR, tests, or logging. */
  fetch?: typeof fetch;
  /** e.g. `"include"` to send cookies cross-origin. */
  credentials?: RequestCredentials;
  /**
   * Static headers or a (possibly async) factory called per request —
   * useful for Authorization tokens.
   */
  headers?: HeadersInit | (() => HeadersInit | Promise<HeadersInit>);
};

async function resolveHeaders(
  headers: FormClientFetchOptions["headers"],
): Promise<HeadersInit | undefined> {
  if (headers == null) return undefined;
  if (typeof headers === "function") return headers();
  return headers;
}

function fallbackMessage(error: {
  statusText: string;
  error?: unknown;
}): string {
  if (typeof error.error === "string" && error.error.trim()) {
    return error.error;
  }
  return error.statusText || "Request failed";
}

/**
 * better-fetch `onError` receives the JSON body spread with `status` /
 * `statusText` — not a `BetterFetchError` instance.
 */
function apiErrorFromFetch(error: {
  status: number;
  statusText: string;
  error?: unknown;
}): APIError {
  const { status } = error;
  if (formFetchErrorSchema.validate(error)) {
    const { message, code, params, issues } = error;
    return new APIError(status, {
      message,
      ...(code !== undefined ? { code } : {}),
      ...(params !== undefined ? { params } : {}),
      ...(issues !== undefined ? { issues } : {}),
    });
  }
  return new APIError(status, { message: fallbackMessage(error) });
}

/**
 * Shared `$fetch` for core routes.
 * `base` is a normalized API prefix (e.g. `/api/form`).
 *
 * Non-OK JSON matching {@link formFetchErrorSchema} throws {@link APIError}.
 */
export function createFormFetch(
  base: string,
  options?: FormClientFetchOptions,
): FormFetch {
  return createFetch({
    baseURL: base,
    throw: true,
    errorSchema: formFetchErrorSchema,
    customFetchImpl: options?.fetch,
    credentials: options?.credentials,
    onRequest: async (ctx) => {
      const extra = await resolveHeaders(options?.headers);
      if (!extra) return ctx;
      const headers = new Headers(ctx.headers);
      new Headers(extra).forEach((value, key) => {
        headers.set(key, value);
      });
      return { ...ctx, headers };
    },
    onError: (ctx) => {
      throw apiErrorFromFetch(ctx.error);
    },
  });
}
