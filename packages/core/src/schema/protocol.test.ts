import { describe, expect, it } from "vitest";

import { formFetchErrorSchema } from "./error";
import {
  getFormQuerySchema,
  listResponsesQuerySchema,
  reopenResponseBodySchema,
  saveDraftBodySchema,
  saveFormBodySchema,
  startResponseBodySchema,
  submitResponseBodySchema,
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
    expect(getFormQuerySchema.validate({})).toBe(false);
    expect(startResponseBodySchema.parse({ formId: " onboarding " })).toEqual({
      formId: "onboarding",
    });
    expect(
      startResponseBodySchema.parse({
        formId: "onboarding",
        respondentId: " user-1 ",
      }),
    ).toEqual({ formId: "onboarding", respondentId: "user-1" });
  });

  it("requires id, title, and fields on saveForm", () => {
    expect(saveFormBodySchema.validate({ title: "X", fields: [] })).toBe(false);
  });

  it("requires responseId and answers on draft", () => {
    expect(saveDraftBodySchema.validate({ responseId: "r" })).toBe(false);
    expect(
      saveDraftBodySchema.parse({ responseId: "r", answers: { name: "Ada" } }),
    ).toEqual({ responseId: "r", answers: { name: "Ada" } });
  });

  it("allows omitting answers on submit", () => {
    expect(submitResponseBodySchema.parse({ responseId: "r" })).toEqual({
      responseId: "r",
    });
  });

  it("requires responseId on reopen", () => {
    expect(reopenResponseBodySchema.validate({})).toBe(false);
    expect(reopenResponseBodySchema.parse({ responseId: "r" })).toEqual({
      responseId: "r",
    });
  });

  it("accepts respondentId on listResponses", () => {
    expect(
      listResponsesQuerySchema.parse({
        formId: " onboarding ",
        respondentId: " user-1 ",
      }),
    ).toEqual({ formId: "onboarding", respondentId: "user-1" });
  });
});
