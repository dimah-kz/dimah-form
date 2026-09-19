import { describe, expect, it } from "vitest";

import { renderFormSlot } from "@/lib/form-slot";

describe("renderFormSlot", () => {
  it("hides on false, replaces on a node, and falls back when omitted", () => {
    expect(renderFormSlot(false, "fallback")).toBeNull();
    expect(renderFormSlot("custom", "fallback")).toBe("custom");
    expect(renderFormSlot(undefined, "fallback")).toBe("fallback");
  });

  it("wraps the default when the slot is a function", () => {
    expect(
      renderFormSlot(({ default: node }) => ["wrap", node], "inner"),
    ).toEqual(["wrap", "inner"]);
  });
});
