import { describe, expect, it } from "vitest";

import { applyPlugins } from "./apply-plugins";

describe("applyPlugins", () => {
  it("accepts an empty plugin list", () => {
    expect(() => applyPlugins(undefined)).not.toThrow();
    expect(() => applyPlugins([])).not.toThrow();
  });

  it("rejects duplicate plugin ids", () => {
    expect(() =>
      applyPlugins([{ id: "analytics" }, { id: "analytics" }]),
    ).toThrow(/Duplicate dimah-form plugin id "analytics"/);
  });
});
