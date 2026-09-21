import { describe, expect, it } from "vitest";

import { readScoringFieldMeta, readScoringFormMeta } from "./meta";
import { tryScoreResponse } from "./score";

describe("readScoringFormMeta", () => {
  it("keeps valid rows and skips a broken variable", () => {
    const read = readScoringFormMeta({
      scoring: {
        variables: [
          { id: "gad7", label: "GAD-7", missing: "nope", max: 21 },
          { id: "" },
        ],
        bands: [{ variable: "gad7", label: "Low", from: 0 }],
        formulas: [
          { id: "total", op: "sum", vars: ["gad7", "gad7"] },
          { id: "sum", op: "sum", vars: ["gad7"] },
        ],
      },
    });
    expect(read?.variables).toEqual([{ id: "gad7", label: "GAD-7", max: 21 }]);
    expect(read?.bands).toEqual([{ variable: "gad7", label: "Low", from: 0 }]);
    expect(read?.formulas).toEqual([{ id: "sum", op: "sum", vars: ["gad7"] }]);
  });

  it("returns undefined when the namespace is absent", () => {
    expect(readScoringFormMeta({ ui: { placeholder: "Ada" } })).toBeUndefined();
  });
});

describe("readScoringFieldMeta", () => {
  it("keeps the variable when reverse is not a boolean", () => {
    expect(
      readScoringFieldMeta({ scoring: { variable: "gad7", reverse: "yes" } }),
    ).toEqual({ variable: "gad7" });
    expect(
      readScoringFieldMeta({ scoring: { variable: "gad7", reverse: true } }),
    ).toEqual({ variable: "gad7", reverse: true });
  });
});

describe("tryScoreResponse", () => {
  it("returns undefined when the form has no scoring meta", () => {
    expect(
      tryScoreResponse({ fields: [{ id: "q1", type: "text" }] }, { q1: "a" }),
    ).toBeUndefined();
  });
});
