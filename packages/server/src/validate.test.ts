import { describe, expect, it } from "vitest";

import { defineForm } from "@dimah-form/core";

import { collectAnswerIssues } from "./validate";

const snapshot = {
  id: "onboarding",
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
        { name: 1, extra: "x", role: "nope" },
        "draft",
      ),
    ).toEqual([
      { field: "name", message: "Expected a string" },
      { field: "extra", message: "Unknown field" },
      { field: "role", message: "Invalid option" },
    ]);
  });
});
