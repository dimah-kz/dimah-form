import { describe, expect, it } from "vitest";

import { defineForm } from "./define";

describe("defineForm", () => {
  it("returns the parsed document", () => {
    const form = defineForm({
      title: "Contact",
      fields: [{ id: "name", type: "text", required: true }],
    });
    expect(form.title).toBe("Contact");
    expect(form.fields[0]?.id).toBe("name");
  });

  it("throws on an invalid document", () => {
    expect(() => defineForm({ title: "", fields: [] })).toThrow();
  });
});
