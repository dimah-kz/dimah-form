import { describe, expect, it } from "vitest";

import { createFieldTypeRegistry, textFieldType } from "./field-types";

describe("createFieldTypeRegistry", () => {
  it("includes the built-in types", () => {
    const registry = createFieldTypeRegistry();
    expect(registry.get("text")).toBe(textFieldType);
    expect(registry.has("select")).toBe(true);
    expect(registry.has("multiSelect")).toBe(true);
  });

  it("registers extra types", () => {
    const registry = createFieldTypeRegistry([
      {
        type: "email",
        validate: () => undefined,
      },
    ]);
    expect(registry.has("email")).toBe(true);
  });

  it("rejects duplicate type strings", () => {
    expect(() =>
      createFieldTypeRegistry([
        {
          type: "text",
          validate: () => undefined,
        },
      ]),
    ).toThrow(/Duplicate dimah-form field type "text"/);
  });

  it("validates minLength on text answers", () => {
    const registry = createFieldTypeRegistry();
    expect(
      registry.get("text")?.validate("ab", { type: "text", minLength: 3 }),
    ).toBe("Must be at least 3 characters");
  });
});
