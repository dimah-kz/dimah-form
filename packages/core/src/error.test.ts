import { APIError as BetterCallAPIError } from "better-call/error";
import { describe, expect, it } from "vitest";

import {
  APIError,
  FORM_ERROR_CODES,
  isAPIError,
  isFormErrorCode,
} from "./error";

describe("APIError", () => {
  it("stores issues on the APIError body", () => {
    const issues = [{ field: "name", message: "Required" }];
    const err = APIError.from("BAD_REQUEST", {
      ...FORM_ERROR_CODES.VALIDATION_ERROR,
      issues,
    });
    expect(err.issues).toEqual(issues);
    expect(err.body).toMatchObject({
      code: "VALIDATION_ERROR",
      issues,
    });
  });

  it("recognizes APIError and catalog codes", () => {
    const err = APIError.from("NOT_FOUND", FORM_ERROR_CODES.UNKNOWN_FORM);
    expect(isAPIError(err)).toBe(true);
    expect(isAPIError(new BetterCallAPIError("UNAUTHORIZED"))).toBe(true);
    expect(isFormErrorCode(err, "UNKNOWN_FORM")).toBe(true);
    expect(isFormErrorCode(err, "NOT_FOUND")).toBe(false);
  });
});
