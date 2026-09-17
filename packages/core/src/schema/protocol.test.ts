import { describe, expect, it } from "vitest";

import { formFetchErrorSchema } from "./error";
import {
  LIST_DEFAULT_LIMIT,
  getFormQuerySchema,
  listFormsQuerySchema,
  listResponsesQuerySchema,
  normalizeListPage,
  pageFromOverfetch,
  paginateItems,
  reopenResponseBodySchema,
  saveDraftBodySchema,
  saveFormBodySchema,
  startResponseBodySchema,
  submitResponseBodySchema,
  toResponseSummary,
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

  it("accepts listForms status and listResponses include", () => {
    expect(
      listFormsQuerySchema.parse({ status: "archived", limit: "10" }),
    ).toMatchObject({ status: "archived", limit: 10 });
    expect(
      listResponsesQuerySchema.parse({
        include: "full",
        status: "submitted",
      }),
    ).toMatchObject({ include: "full", status: "submitted" });
  });
});

describe("list pagination", () => {
  it("defaults limit and offset", () => {
    expect(normalizeListPage()).toEqual({
      limit: LIST_DEFAULT_LIMIT,
      offset: 0,
    });
    expect(normalizeListPage({ limit: 10, offset: 20 })).toEqual({
      limit: 10,
      offset: 20,
    });
  });

  it("pages in-memory items and overfetched rows", () => {
    expect(paginateItems(["a", "b", "c"], 2, 0)).toEqual({
      items: ["a", "b"],
      nextOffset: 2,
    });
    expect(paginateItems(["a", "b"], 2, 0)).toEqual({
      items: ["a", "b"],
      nextOffset: null,
    });
    expect(pageFromOverfetch(["a", "b", "c"], 2, 0)).toEqual({
      items: ["a", "b"],
      nextOffset: 2,
    });
    expect(pageFromOverfetch(["a", "b"], 2, 10)).toEqual({
      items: ["a", "b"],
      nextOffset: null,
    });
  });

  it("strips answers and definition from a summary", () => {
    expect(
      toResponseSummary({
        id: "r1",
        formId: "onboarding",
        status: "draft",
        definition: {
          id: "onboarding",
          slug: "onboarding",
          status: "active",
          title: "Onboarding",
          fields: [],
        },
        answers: { name: "Ada" },
        respondentId: null,
        submittedAt: null,
        createdAt: "t",
        updatedAt: "t",
      }),
    ).toEqual({
      id: "r1",
      formId: "onboarding",
      status: "draft",
      respondentId: null,
      submittedAt: null,
      createdAt: "t",
      updatedAt: "t",
    });
  });
});
