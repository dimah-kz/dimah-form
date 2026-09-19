import { describe, expect, it } from "vitest";

import { renderFormSlot } from "@/lib/form-slot";

describe("renderFormSlot", () => {
  it("hides on false, replaces on a node, and falls back when omitted", () => {
    expect(renderFormSlot(false, "fallback")).toBeNull();
    expect(renderFormSlot("custom", "fallback")).toBe("custom");
    expect(renderFormSlot(undefined, "fallback")).toBe("fallback");
  });
});
