import { describe, expect, it } from "vitest";

import { APIError, FORM_ERROR_CODES } from "./error";
import {
  emptyToNull,
  fieldIssueMap,
  fieldLabel,
  fieldOptions,
  formCompletion,
  formErrorCode,
  formErrorMessage,
  formatAnswer,
  issuesByField,
  visibleFields,
} from "./field-view";
import { defineFieldType } from "./define";

describe("fieldLabel", () => {
  it("falls back to the field id", () => {
    expect(fieldLabel({ id: "name" })).toBe("name");
    expect(fieldLabel({ id: "name", label: "Name" })).toBe("Name");
  });
});

describe("fieldOptions", () => {
  it("skips invalid entries and fills label from value", () => {
    expect(
      fieldOptions({
        id: "role",
        type: "select",
        options: [
          { value: "eng", label: "Engineer" },
          { value: "pm" },
          { label: "nope" },
          null,
        ],
      }),
    ).toEqual([
      { value: "eng", label: "Engineer" },
      { value: "pm", label: "pm" },
    ]);
  });

  it("returns an empty list when options are missing", () => {
    expect(fieldOptions({ id: "name", type: "text" })).toEqual([]);
  });

  it("keeps option meta", () => {
    expect(
      fieldOptions({
        id: "role",
        type: "select",
        options: [{ value: "eng", meta: { icon: "cpu" } }],
      }),
    ).toEqual([{ value: "eng", label: "eng", meta: { icon: "cpu" } }]);
  });
});

describe("visibleFields", () => {
  it("keeps fields whose showWhen matches", () => {
    const fields = [
      { id: "role", type: "select" },
      {
        id: "team",
        type: "text",
        showWhen: { field: "role", equals: "eng" },
      },
    ];
    expect(
      visibleFields({ fields }, { role: "pm" }).map((field) => field.id),
    ).toEqual(["role"]);
    expect(
      visibleFields({ fields }, { role: "eng" }).map((field) => field.id),
    ).toEqual(["role", "team"]);
  });

  it("hides nested fields when the parent is hidden", () => {
    const fields = [
      { id: "a", type: "text" },
      { id: "b", type: "text", showWhen: { field: "a", equals: "yes" } },
      { id: "c", type: "text", showWhen: { field: "b", equals: "ok" } },
    ];
    expect(
      visibleFields({ fields }, { a: "no", b: "ok", c: "keep" }).map(
        (field) => field.id,
      ),
    ).toEqual(["a"]);
  });
});

describe("issuesByField", () => {
  it("maps an issue list and a VALIDATION_ERROR", () => {
    const issues = [{ field: "name", message: "Required" }];
    expect(issuesByField(issues)).toEqual({ name: "Required" });
    expect(
      issuesByField(
        APIError.from("BAD_REQUEST", {
          ...FORM_ERROR_CODES.VALIDATION_ERROR,
          issues,
        }),
      ),
    ).toEqual({ name: "Required" });
    expect(issuesByField(new Error("nope"))).toEqual({});
  });

  it("keeps code and params on fieldIssueMap", () => {
    expect(
      fieldIssueMap([{ field: "name", message: "Required", code: "REQUIRED" }]),
    ).toEqual({
      name: { field: "name", message: "Required", code: "REQUIRED" },
    });
  });
});

describe("formErrorMessage", () => {
  it("prefers APIError then Error then fallback", () => {
    expect(
      formErrorMessage(
        APIError.from("CONFLICT", FORM_ERROR_CODES.FORM_INACTIVE),
      ),
    ).toBe("Form is not active");
    expect(formErrorMessage(new Error("boom"), "nope")).toBe("boom");
    expect(formErrorMessage("x")).toBe("Request failed");
  });
});

describe("formErrorCode", () => {
  it("reads APIError.code and ignores other throws", () => {
    expect(
      formErrorCode(APIError.from("CONFLICT", FORM_ERROR_CODES.STALE_UPDATE)),
    ).toBe("STALE_UPDATE");
    expect(formErrorCode(new Error("boom"))).toBeUndefined();
  });
});

describe("emptyToNull", () => {
  it("turns empty strings and arrays into null", () => {
    expect(emptyToNull("")).toBeNull();
    expect(emptyToNull([])).toBeNull();
    expect(emptyToNull("Ada")).toBe("Ada");
    expect(emptyToNull(["ts"])).toEqual(["ts"]);
  });
});

describe("formCompletion", () => {
  it("counts visible required fields", () => {
    const fields = [
      { id: "name", type: "text", required: true },
      { id: "ok", type: "boolean", required: true },
      { id: "note", type: "text" },
    ];
    expect(formCompletion({ fields }, { name: "Ada" })).toEqual({
      required: 2,
      answered: 1,
      complete: false,
    });
    expect(formCompletion({ fields }, { name: "Ada", ok: false })).toEqual({
      required: 2,
      answered: 2,
      complete: true,
    });
  });
});

describe("formatAnswer", () => {
  it("uses option labels and Yes/No", () => {
    expect(
      formatAnswer(
        {
          id: "role",
          type: "select",
          options: [{ value: "eng", label: "Engineer" }],
        },
        "eng",
      ),
    ).toBe("Engineer");
    expect(formatAnswer({ id: "ok", type: "boolean" }, true)).toBe("Yes");
    expect(formatAnswer({ id: "ok", type: "boolean" }, false)).toBe("No");
    expect(formatAnswer({ id: "ok", type: "boolean" }, "x")).toBe("");
    expect(formatAnswer({ id: "name", type: "text" }, null)).toBe("");
  });

  it("uses defineFieldType.format when fieldTypes are passed", () => {
    const rating = defineFieldType({
      type: "rating",
      validate: () => undefined,
      format: (value, field) => {
        const max =
          typeof field.max === "number" && Number.isInteger(field.max)
            ? field.max
            : 5;
        return typeof value === "number" ? `${value}/${max}` : "";
      },
      $Infer: 0 as number,
    });
    expect(
      formatAnswer({ id: "score", type: "rating", max: 5 }, 4, [rating]),
    ).toBe("4/5");
    expect(formatAnswer({ id: "score", type: "rating" }, 4)).toBe("4");
  });
});
