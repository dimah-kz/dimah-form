/** One stable `{ code, message }` pair from {@link defineErrorCodes}. */
export type ErrorCodeEntry = {
  readonly code: string;
  readonly message: string;
};

/** Plugin or core error catalog. Keys are the stable `code` strings. */
export type ErrorCodeCatalog = Record<string, ErrorCodeEntry>;

/**
 * Pair each stable API `code` with its English `message`.
 * Same shape as Better Auth `defineErrorCodes`. Plugin packages should call
 * this once and attach the catalog on both the server and client plugin.
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
  FORM_INACTIVE: "Form is not active",
  STALE_UPDATE: "Response was updated",
  RESPONSE_NOT_DRAFT: "Response is not a draft",
  RESPONSE_NOT_LOCKED: "Response is not locked",
  CODE_AUTHORED_FORM: "Cannot modify a code-authored form",
  FORM_HAS_RESPONSES: "Form still has responses",
  SLUG_TAKEN: "Form slug is already in use",
  UNKNOWN_FIELD_TYPE: "Unknown field type",
});

export type FormErrorCode = keyof typeof FORM_ERROR_CODES;
