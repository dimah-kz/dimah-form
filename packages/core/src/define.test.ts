import { describe, expect, it } from "vitest";

import { defineFieldType, defineForm } from "./define";

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

  it("allows unknown field types in the document", () => {
    const form = defineForm({
      title: "Intake",
      fields: [{ id: "email", type: "email", required: true }],
    });
    expect(form.fields[0]?.type).toBe("email");
  });
});

describe("defineFieldType", () => {
  it("returns the descriptor", () => {
    const email = defineFieldType({
      type: "email",
      validate: (value, _field) =>
        typeof value === "string" ? undefined : "Expected an email",
      $Infer: "" as string,
    });
    expect(email.type).toBe("email");
    expect(email.validate("a@b.c", { type: "email" })).toBeUndefined();
  });
});
