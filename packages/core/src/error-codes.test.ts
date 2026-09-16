import { describe, expect, it } from "vitest";

import { defineErrorCodes, FORM_ERROR_CODES } from "./error-codes";

describe("FORM_ERROR_CODES", () => {
  it("pairs stable codes with English messages", () => {
    expect(FORM_ERROR_CODES.VALIDATION_ERROR.code).toBe("VALIDATION_ERROR");
    expect(FORM_ERROR_CODES.RESPONSE_NOT_DRAFT.code).toBe("RESPONSE_NOT_DRAFT");
    expect(FORM_ERROR_CODES.CODE_AUTHORED_FORM.code).toBe("CODE_AUTHORED_FORM");
    expect(FORM_ERROR_CODES.FORM_HAS_RESPONSES.code).toBe("FORM_HAS_RESPONSES");
    expect(FORM_ERROR_CODES.SLUG_TAKEN.code).toBe("SLUG_TAKEN");
    expect(FORM_ERROR_CODES.UNKNOWN_FIELD_TYPE.code).toBe("UNKNOWN_FIELD_TYPE");
    expect(defineErrorCodes({ X: "x" }).X).toEqual({ code: "X", message: "x" });
  });
});
