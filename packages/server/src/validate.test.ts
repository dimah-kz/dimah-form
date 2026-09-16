import { describe, expect, it } from "vitest";

import { createFieldTypeRegistry, defineForm } from "@dimah-form/core";

import { applyAnswerPatch, collectAnswerIssues } from "./validate";

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
      { field: "ok", message: "Required" },
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
      { field: "name", message: "Expected a string" },
      { field: "extra", message: "Unknown field" },
      { field: "role", message: "Invalid option" },
      { field: "skills", message: "Invalid option" },
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
    ).toEqual([{ field: "skills", message: "Required" }]);
  });

  it("treats blank required text as missing", () => {
    expect(
      collectAnswerIssues(snapshot, { name: "  ", ok: true }, "submit"),
    ).toEqual([{ field: "name", message: "Required" }]);
  });

  it("uses a custom field type from the registry", () => {
    const registry = createFieldTypeRegistry([
      {
        type: "email",
        isEmpty: (value) =>
          value == null || (typeof value === "string" && value.trim() === ""),
        validate: (value) =>
          typeof value === "string" && value.includes("@")
            ? undefined
            : "Expected an email",
      },
    ]);
    const intake = {
      id: "intake",
      slug: "intake",
      status: "active" as const,
      title: "Intake",
      fields: [{ id: "email", type: "email", required: true }],
    };
    expect(
      collectAnswerIssues(intake, { email: "nope" }, "draft", registry),
    ).toEqual([{ field: "email", message: "Expected an email" }]);
    expect(
      collectAnswerIssues(intake, { email: "  " }, "submit", registry),
    ).toEqual([{ field: "email", message: "Required" }]);
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
    ).toEqual([{ field: "confirm", message: "Must match" }]);
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
      { field: "name", message: "Must be at least 3 characters" },
    ]);
  });
});

describe("applyAnswerPatch", () => {
  it("merges keys and deletes nulls", () => {
    expect(
      applyAnswerPatch({ name: "Ada", ok: true }, { ok: null, age: 1 }),
    ).toEqual({ name: "Ada", age: 1 });
  });
});
