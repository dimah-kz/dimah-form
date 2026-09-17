import { describe, expect, it } from "vitest";

import { defineErrorCodes, FORM_ERROR_CODES } from "./error-codes";

describe("FORM_ERROR_CODES", () => {
  it("freezes the v1 catalog as stable code + English message pairs", () => {
    expect(FORM_ERROR_CODES).toEqual({
      NOT_FOUND: { code: "NOT_FOUND", message: "Not Found" },
      UNAUTHORIZED: { code: "UNAUTHORIZED", message: "Unauthorized" },
      FORBIDDEN: { code: "FORBIDDEN", message: "Forbidden" },
      CONFLICT: { code: "CONFLICT", message: "Conflict" },
      INTERNAL_ERROR: {
        code: "INTERNAL_ERROR",
        message: "Internal server error",
      },
      VALIDATION_ERROR: {
        code: "VALIDATION_ERROR",
        message: "Validation Error",
      },
      UNKNOWN_FORM: { code: "UNKNOWN_FORM", message: "Unknown form" },
      UNKNOWN_RESPONSE: {
        code: "UNKNOWN_RESPONSE",
        message: "Unknown response",
      },
      FORM_INACTIVE: { code: "FORM_INACTIVE", message: "Form is not active" },
      STALE_UPDATE: { code: "STALE_UPDATE", message: "Response was updated" },
      RESPONSE_NOT_DRAFT: {
        code: "RESPONSE_NOT_DRAFT",
        message: "Response is not a draft",
      },
      RESPONSE_NOT_LOCKED: {
        code: "RESPONSE_NOT_LOCKED",
        message: "Response is not locked",
      },
      CODE_AUTHORED_FORM: {
        code: "CODE_AUTHORED_FORM",
        message: "Cannot modify a code-authored form",
      },
      FORM_HAS_RESPONSES: {
        code: "FORM_HAS_RESPONSES",
        message: "Form still has responses",
      },
      SLUG_TAKEN: {
        code: "SLUG_TAKEN",
        message: "Form slug is already in use",
      },
      UNKNOWN_FIELD_TYPE: {
        code: "UNKNOWN_FIELD_TYPE",
        message: "Unknown field type",
      },
    });
    expect(defineErrorCodes({ X: "x" }).X).toEqual({ code: "X", message: "x" });
  });
});
