import { describe, expect, it } from "vitest";

import { FIELD_ISSUE_CODES } from "./error-codes";
import { defineForm } from "./define";
import { isFormErrorCode } from "./error";
import { createFieldTypeRegistry } from "./field-types";
import {
  applyAnswerPatch,
  collectAnswerIssues,
  isFieldVisible,
  parseAnswers,
  seedDefaultAnswers,
  stripHiddenAnswers,
} from "./answers";

const snapshot = {
  id: "onboarding",
  slug: "onboarding",
  status: "active" as const,
  ...defineForm({
    title: "Onboarding",
    fields: [
      { id: "name", type: "text", required: true },
      { id: "age", type: "number" },
      { id: "ok", type: "boolean", required: true },
      {
        id: "role",
        type: "select",
        options: [{ value: "eng" }, { value: "pm" }],
      },
      {
        id: "skills",
        type: "multiSelect",
        options: [{ value: "ts" }, { value: "go" }],
      },
    ],
  }),
};

describe("collectAnswerIssues", () => {
  it("allows missing required fields on draft", () => {
    expect(collectAnswerIssues(snapshot, { name: "Ada" }, "draft")).toEqual([]);
  });

  it("requires required fields on submit", () => {
    expect(collectAnswerIssues(snapshot, { name: "Ada" }, "submit")).toEqual([
      { field: "ok", ...FIELD_ISSUE_CODES.REQUIRED },
    ]);
  });

  it("treats false as a present boolean", () => {
    expect(
      collectAnswerIssues(snapshot, { name: "Ada", ok: false }, "submit"),
    ).toEqual([]);
  });

  it("rejects unknown keys and invalid types", () => {
    expect(
      collectAnswerIssues(
        snapshot,
        { name: 1, extra: "x", role: "nope", skills: ["nope"] },
        "draft",
      ),
    ).toEqual([
      { field: "name", ...FIELD_ISSUE_CODES.EXPECTED_STRING },
      { field: "extra", ...FIELD_ISSUE_CODES.UNKNOWN_FIELD },
      { field: "role", ...FIELD_ISSUE_CODES.INVALID_OPTION },
      { field: "skills", ...FIELD_ISSUE_CODES.INVALID_OPTION },
    ]);
  });

  it("treats an empty multiSelect as missing when required", () => {
    const requiredSkills = {
      ...snapshot,
      fields: [
        {
          id: "skills",
          type: "multiSelect",
          required: true,
          options: [{ value: "ts" }],
        },
      ],
    };
    expect(
      collectAnswerIssues(requiredSkills, { skills: [] }, "submit"),
    ).toEqual([{ field: "skills", ...FIELD_ISSUE_CODES.REQUIRED }]);
  });

  it("treats blank required text as missing", () => {
    expect(
      collectAnswerIssues(snapshot, { name: "  ", ok: true }, "submit"),
    ).toEqual([{ field: "name", ...FIELD_ISSUE_CODES.REQUIRED }]);
  });

  it("treats a blank number as empty on draft", () => {
    expect(collectAnswerIssues(snapshot, { age: "" }, "draft")).toEqual([]);
  });

  it("validates builtin email and date", () => {
    const form = {
      id: "intake",
      slug: "intake",
      status: "active" as const,
      title: "Intake",
      fields: [
        { id: "email", type: "email", required: true },
        { id: "born", type: "date" },
      ],
    };
    expect(collectAnswerIssues(form, { email: "nope" }, "draft")).toEqual([
      { field: "email", ...FIELD_ISSUE_CODES.EXPECTED_EMAIL },
    ]);
    expect(collectAnswerIssues(form, { email: "  " }, "submit")).toEqual([
      { field: "email", ...FIELD_ISSUE_CODES.REQUIRED },
    ]);
    expect(
      collectAnswerIssues(
        form,
        { email: "ada@n.com", born: "2026-02-31" },
        "draft",
      ),
    ).toEqual([{ field: "born", ...FIELD_ISSUE_CODES.EXPECTED_DATE }]);
    expect(
      collectAnswerIssues(
        form,
        { email: "ada@n.com", born: "2026-01-02" },
        "submit",
      ),
    ).toEqual([]);
  });

  it("uses a custom field type from the registry", () => {
    const registry = createFieldTypeRegistry([
      {
        type: "handle",
        isEmpty: (value) =>
          value == null || (typeof value === "string" && value.trim() === ""),
        validate: (value) =>
          typeof value === "string" && value.startsWith("@")
            ? undefined
            : "Expected a handle",
      },
    ]);
    const intake = {
      id: "intake",
      slug: "intake",
      status: "active" as const,
      title: "Intake",
      fields: [{ id: "handle", type: "handle", required: true }],
    };
    expect(
      collectAnswerIssues(intake, { handle: "nope" }, "draft", registry),
    ).toEqual([
      {
        field: "handle",
        code: FIELD_ISSUE_CODES.INVALID.code,
        message: "Expected a handle",
      },
    ]);
    expect(
      collectAnswerIssues(intake, { handle: "  " }, "submit", registry),
    ).toEqual([{ field: "handle", ...FIELD_ISSUE_CODES.REQUIRED }]);
  });

  it("passes sibling answers to validate", () => {
    const registry = createFieldTypeRegistry([
      {
        type: "confirm",
        validate: (value, _field, context) =>
          value === context?.answers.password ? undefined : "Must match",
      },
    ]);
    const form = {
      id: "signup",
      slug: "signup",
      status: "active" as const,
      title: "Signup",
      fields: [
        { id: "password", type: "text", required: true },
        { id: "confirm", type: "confirm", required: true },
      ],
    };
    expect(
      collectAnswerIssues(
        form,
        { password: "secret", confirm: "nope" },
        "submit",
        registry,
      ),
    ).toEqual([
      {
        field: "confirm",
        code: FIELD_ISSUE_CODES.INVALID.code,
        message: "Must match",
      },
    ]);
    expect(
      collectAnswerIssues(
        form,
        { password: "secret", confirm: "secret" },
        "submit",
        registry,
      ),
    ).toEqual([]);
  });

  it("enforces text minLength", () => {
    const short = {
      ...snapshot,
      fields: [{ id: "name", type: "text", minLength: 3 }],
    };
    expect(collectAnswerIssues(short, { name: "ab" }, "draft")).toEqual([
      {
        field: "name",
        ...FIELD_ISSUE_CODES.TOO_SHORT,
        message: "Must be at least 3 characters",
        params: { min: 3 },
      },
    ]);
  });

  it("skips required hidden fields and strips their answers", () => {
    const form = {
      id: "job",
      slug: "job",
      status: "active" as const,
      title: "Job",
      fields: [
        { id: "employed", type: "boolean", required: true },
        {
          id: "company",
          type: "text",
          required: true,
          showWhen: { field: "employed", equals: true },
        },
      ],
    };
    expect(
      collectAnswerIssues(form, { employed: false, company: "Acme" }, "submit"),
    ).toEqual([]);
    expect(
      parseAnswers(form, { employed: false, company: "Acme" }, "submit"),
    ).toEqual({ employed: false });
    expect(collectAnswerIssues(form, { employed: true }, "submit")).toEqual([
      { field: "company", ...FIELD_ISSUE_CODES.REQUIRED },
    ]);
  });

  it("rejects an unregistered field type", () => {
    const form = {
      ...snapshot,
      fields: [{ id: "file", type: "file", required: true }],
    };
    expect(collectAnswerIssues(form, { file: "x" }, "draft")).toEqual([
      { field: "file", ...FIELD_ISSUE_CODES.UNKNOWN_FIELD_TYPE },
    ]);
  });

  it("throws VALIDATION_ERROR from parseAnswers", () => {
    let thrown: unknown;
    try {
      parseAnswers(snapshot, { name: 1 }, "draft");
    } catch (error) {
      thrown = error;
    }
    expect(isFormErrorCode(thrown, "VALIDATION_ERROR")).toBe(true);
  });

  it("appends form-level validateAnswers issues", () => {
    expect(
      collectAnswerIssues(
        snapshot,
        { name: "Ada", ok: true, age: 10 },
        "submit",
        undefined,
        (_definition, answers) => {
          if (typeof answers.age === "number" && answers.age < 18) {
            return [
              {
                field: "age",
                message: "Must be 18 or older",
                code: "TOO_YOUNG",
              },
            ];
          }
          return undefined;
        },
      ),
    ).toEqual([
      { field: "age", message: "Must be 18 or older", code: "TOO_YOUNG" },
    ]);
  });
});

describe("showWhen", () => {
  const company = {
    id: "company",
    type: "text",
    showWhen: { field: "employed", equals: true },
  };

  it("is hidden until the sibling matches", () => {
    expect(isFieldVisible(company, { employed: false })).toBe(false);
    expect(isFieldVisible(company, { employed: true })).toBe(true);
  });

  it("matches includes against array answers", () => {
    const extra = {
      id: "stack",
      type: "text",
      showWhen: { field: "skills", includes: "ts" },
    };
    expect(isFieldVisible(extra, { skills: ["go"] })).toBe(false);
    expect(isFieldVisible(extra, { skills: ["ts", "go"] })).toBe(true);
  });

  it("treats an equals list as one-of", () => {
    const team = {
      id: "team",
      type: "text",
      showWhen: { field: "role", equals: ["eng", "design"] },
    };
    expect(isFieldVisible(team, { role: "eng" })).toBe(true);
    expect(isFieldVisible(team, { role: "pm" })).toBe(false);
  });

  it("treats an includes list as any-of", () => {
    const extra = {
      id: "stack",
      type: "text",
      showWhen: { field: "skills", includes: ["ts", "go"] },
    };
    expect(isFieldVisible(extra, { skills: ["rust"] })).toBe(false);
    expect(isFieldVisible(extra, { skills: ["go"] })).toBe(true);
  });

  it("drops nested hidden fields after a parent is stripped", () => {
    const form = {
      fields: [
        { id: "a", type: "text" },
        { id: "b", type: "text", showWhen: { field: "a", equals: "yes" } },
        { id: "c", type: "text", showWhen: { field: "b", equals: "ok" } },
      ],
    };
    expect(stripHiddenAnswers(form, { a: "no", b: "ok", c: "keep" })).toEqual({
      a: "no",
    });
  });

  it("skips required nested fields when the parent is hidden", () => {
    const form = {
      id: "job",
      slug: "job",
      status: "active" as const,
      title: "Job",
      fields: [
        { id: "a", type: "text", required: true },
        {
          id: "b",
          type: "text",
          required: true,
          showWhen: { field: "a", equals: "yes" },
        },
        {
          id: "c",
          type: "text",
          required: true,
          showWhen: { field: "b", equals: "ok" },
        },
      ],
    };
    expect(
      collectAnswerIssues(form, { a: "no", b: "ok", c: "keep" }, "submit"),
    ).toEqual([]);
    expect(collectAnswerIssues(form, { a: "yes", b: "ok" }, "submit")).toEqual([
      { field: "c", ...FIELD_ISSUE_CODES.REQUIRED },
    ]);
  });
});

describe("seedDefaultAnswers", () => {
  it("applies defaults then strips hidden fields", () => {
    expect(
      seedDefaultAnswers({
        fields: [
          { id: "employed", type: "boolean", defaultValue: false },
          {
            id: "company",
            type: "text",
            defaultValue: "Acme",
            showWhen: { field: "employed", equals: true },
          },
        ],
      }),
    ).toEqual({ employed: false });
  });
});

describe("applyAnswerPatch", () => {
  it("merges keys and deletes nulls", () => {
    expect(
      applyAnswerPatch({ name: "Ada", ok: true }, { ok: null, age: 1 }),
    ).toEqual({ name: "Ada", age: 1 });
  });
});
