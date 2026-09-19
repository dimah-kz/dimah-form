import { describe, expect, it } from "vitest";

import {
  collectShowWhenIssues,
  isFieldVisible,
  matchesEquals,
  matchesIncludes,
} from "./show-when";

describe("matchesEquals", () => {
  it("uses Object.is for a scalar", () => {
    expect(matchesEquals("eng", "eng")).toBe(true);
    expect(matchesEquals("eng", "pm")).toBe(false);
    expect(matchesEquals(1, "1")).toBe(false);
  });

  it("treats a scalar list as one-of", () => {
    expect(matchesEquals("eng", ["eng", "design"])).toBe(true);
    expect(matchesEquals("pm", ["eng", "design"])).toBe(false);
  });
});

describe("matchesIncludes", () => {
  it("matches one value inside an array sibling", () => {
    expect(matchesIncludes(["ts", "go"], "ts")).toBe(true);
    expect(matchesIncludes(["go"], "ts")).toBe(false);
    expect(matchesIncludes("ts", "ts")).toBe(false);
  });

  it("treats a scalar list as any-of", () => {
    expect(matchesIncludes(["go", "rust"], ["ts", "go"])).toBe(true);
    expect(matchesIncludes(["rust"], ["ts", "go"])).toBe(false);
  });
});

describe("isFieldVisible", () => {
  const a = { id: "a", type: "text" };
  const b = {
    id: "b",
    type: "text",
    showWhen: { field: "a", equals: "yes" },
  };
  const c = {
    id: "c",
    type: "text",
    showWhen: { field: "b", equals: "ok" },
  };
  const fields = [a, b, c];

  it("hides nested fields when the parent is hidden", () => {
    const answers = { a: "no", b: "ok", c: "keep" };
    expect(isFieldVisible(c, answers, fields)).toBe(false);
    expect(isFieldVisible(b, answers, fields)).toBe(false);
    expect(isFieldVisible(a, answers, fields)).toBe(true);
  });

  it("keeps nested fields when every parent matches", () => {
    const answers = { a: "yes", b: "ok", c: "keep" };
    expect(isFieldVisible(c, answers, fields)).toBe(true);
  });

  it("hides the whole chain on a cycle", () => {
    const left = {
      id: "a",
      type: "text",
      showWhen: { field: "b", equals: "x" },
    };
    const right = {
      id: "b",
      type: "text",
      showWhen: { field: "a", equals: "y" },
    };
    const cycle = [left, right];
    expect(isFieldVisible(left, { a: "y", b: "x" }, cycle)).toBe(false);
  });
});

describe("collectShowWhenIssues", () => {
  it("rejects a missing sibling, self-reference, extra keys, and cycles", () => {
    expect(
      collectShowWhenIssues([
        {
          id: "company",
          type: "text",
          showWhen: { field: "employed", equals: true },
        },
      ]),
    ).toEqual(['showWhen on "company" references unknown field "employed"']);
    expect(
      collectShowWhenIssues([
        {
          id: "n",
          type: "text",
          showWhen: { field: "n", equals: "x" },
        },
      ]),
    ).toEqual(['showWhen on "n" cannot reference itself']);
    expect(
      collectShowWhenIssues([
        { id: "role", type: "select" },
        {
          id: "team",
          type: "text",
          showWhen: { field: "role", equals: "eng", not: true },
        },
      ]),
    ).toEqual(['showWhen on "team" has unknown key "not"']);
    expect(
      collectShowWhenIssues([
        {
          id: "a",
          type: "text",
          showWhen: { field: "b", equals: "x" },
        },
        {
          id: "b",
          type: "text",
          showWhen: { field: "a", equals: "y" },
        },
      ]),
    ).toEqual(['showWhen cycle involving "a", "b"']);
  });

  it("rejects equals against a multiSelect sibling", () => {
    expect(
      collectShowWhenIssues([
        {
          id: "skills",
          type: "multiSelect",
        },
        {
          id: "note",
          type: "text",
          showWhen: { field: "skills", equals: "ts" },
        },
      ]),
    ).toEqual([
      'showWhen on "note" cannot use equals against multiSelect "skills"; use includes',
    ]);
  });
});
