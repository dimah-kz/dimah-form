import { createFetch } from "@better-fetch/fetch";

import { FORM_ERROR_CODES } from "./error-codes";
import { normalizeFormApiBasePath } from "./routes";

export type CreateFormClientOptions = {
  /** API path prefix — must match server `basePath`. @default "/api/form" */
  basePath?: string;
  /**
   * Absolute client origin + path (e.g. `https://api.example.com/api/form`).
   * Wins over {@link basePath} when both are set.
   */
  baseURL?: string;
};

export type CreateFormClientResult = {
  $fetch: ReturnType<typeof createFetch>;
  baseURL: string;
  $ERROR_CODES: typeof FORM_ERROR_CODES;
};

/** Typed better-fetch client for the questionnaire protocol. */
export function createFormClient(
  options: CreateFormClientOptions = {},
): CreateFormClientResult {
  const baseURL = options.baseURL ?? normalizeFormApiBasePath(options.basePath);

  return {
    $fetch: createFetch({ baseURL }),
    baseURL,
    $ERROR_CODES: FORM_ERROR_CODES,
  };
}
