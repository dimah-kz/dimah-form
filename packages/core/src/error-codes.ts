/**
 * Pair each stable API `code` with its English `message`.
 * Same shape as Better Auth `defineErrorCodes`.
 */
export function defineErrorCodes<const T extends Record<string, string>>(
  messages: T,
): { readonly [K in keyof T]: { readonly code: K; readonly message: T[K] } } {
  const codes = {} as {
    [K in keyof T]: { readonly code: K; readonly message: T[K] };
  };
  for (const code of Object.keys(messages) as (keyof T)[]) {
    codes[code] = { code, message: messages[code] };
  }
  return codes;
}

export const FORM_ERROR_CODES = defineErrorCodes({
  NOT_FOUND: "Not Found",
  UNAUTHORIZED: "Unauthorized",
  FORBIDDEN: "Forbidden",
  CONFLICT: "Conflict",
  INTERNAL_ERROR: "Internal server error",
  VALIDATION_ERROR: "Validation Error",
  UNKNOWN_FORM: "Unknown form",
  UNKNOWN_RESPONSE: "Unknown response",
});

export type FormErrorCode = keyof typeof FORM_ERROR_CODES;
