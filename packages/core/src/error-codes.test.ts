import { describe, expect, it } from "vitest";

import { defineErrorCodes, FORM_ERROR_CODES } from "./error-codes";

describe("FORM_ERROR_CODES", () => {
  it("pairs stable codes with English messages", () => {
    expect(FORM_ERROR_CODES.VALIDATION_ERROR.code).toBe("VALIDATION_ERROR");
    expect(defineErrorCodes({ X: "x" }).X).toEqual({ code: "X", message: "x" });
  });
});
