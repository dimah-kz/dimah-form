import { describe, expect, it } from "vitest";

import { formFetchErrorSchema } from "./error";
import {
  getFormQuerySchema,
  saveDraftBodySchema,
  startResponseBodySchema,
} from "./protocol";

describe("formFetchErrorSchema", () => {
  it("accepts the API error JSON body including issues", () => {
    expect(
      formFetchErrorSchema.parse({
        message: "Validation Error",
        code: "VALIDATION_ERROR",
        issues: [{ field: "name", message: "Required" }],
      }),
    ).toEqual({
      message: "Validation Error",
      code: "VALIDATION_ERROR",
      issues: [{ field: "name", message: "Required" }],
    });
  });

  it("requires message", () => {
    expect(formFetchErrorSchema.validate({ code: "X" })).toBe(false);
  });
});

describe("protocol payloads", () => {
  it("requires formId on get and start", () => {
    expect(getFormQuerySchema.safeParse({}).success).toBe(false);
    expect(startResponseBodySchema.parse({ formId: " onboarding " })).toEqual({
      formId: "onboarding",
    });
  });

  it("requires responseId and answers on draft", () => {
    expect(saveDraftBodySchema.safeParse({ responseId: "r" }).success).toBe(
      false,
    );
    expect(
      saveDraftBodySchema.parse({ responseId: "r", answers: { name: "Ada" } }),
    ).toEqual({ responseId: "r", answers: { name: "Ada" } });
  });
});
