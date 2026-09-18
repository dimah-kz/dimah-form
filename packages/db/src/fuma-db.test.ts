import { describe, expect, it } from "vitest";

import { DimahFormDB, v1 } from "./fuma-db";

describe("DimahFormDB", () => {
  it("registers the v1 schema namespace", () => {
    expect(v1.version).toBe("1.0.0");
    expect(Object.keys(v1.tables).toSorted()).toEqual([
      "questionnaire",
      "response",
    ]);
    expect(DimahFormDB).toBeDefined();
  });
});
