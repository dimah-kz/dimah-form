import { normalizeFormSnapshot, type ResponseRecord } from "@dimah-form/core";
import { describe, expect, it } from "vitest";

import { rowMatchesWhere } from "./where";

const definition = normalizeFormSnapshot({
  id: "quiz",
  title: "Quiz",
  fields: [
    { id: "age", type: "number" },
    { id: "ok", type: "boolean" },
    {
      id: "skills",
      type: "multiSelect",
      options: [{ value: "ts" }, { value: "go" }],
    },
    { id: "city", type: "select", options: [{ value: "tehran" }] },
  ],
});

function row(answers: Record<string, unknown>): ResponseRecord {
  return {
    id: "r1",
    formId: "quiz",
    status: "submitted",
    definition,
    answers,
    respondentId: null,
    submittedAt: "2026-01-15T00:00:00.000Z",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-15T00:00:00.000Z",
  };
}

describe("rowMatchesWhere", () => {
  it("coerces finite numbers to the query string", () => {
    expect(rowMatchesWhere(row({ age: 5 }), "age", "5")).toBe(true);
    expect(rowMatchesWhere(row({ age: 5 }), "age", "6")).toBe(false);
    expect(rowMatchesWhere(row({ age: Number.NaN }), "age", "NaN")).toBe(false);
  });

  it("keeps boolean, multiSelect, and string equality", () => {
    expect(rowMatchesWhere(row({ ok: true }), "ok", "true")).toBe(true);
    expect(rowMatchesWhere(row({ ok: false }), "ok", "true")).toBe(false);
    expect(rowMatchesWhere(row({ ok: true }), "ok", "yes")).toBe(false);
    expect(rowMatchesWhere(row({ skills: ["ts", "go"] }), "skills", "go")).toBe(
      true,
    );
    expect(rowMatchesWhere(row({ skills: ["ts"] }), "skills", "go")).toBe(
      false,
    );
    expect(rowMatchesWhere(row({ city: "tehran" }), "city", "tehran")).toBe(
      true,
    );
  });

  it("does not match an unknown field", () => {
    expect(rowMatchesWhere(row({ age: 5 }), "missing", "5")).toBe(false);
  });
});
