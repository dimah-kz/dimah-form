import { describe, expect, it } from "vitest";

import {
  createFieldTypeRegistry,
  dateFieldType,
  emailFieldType,
  numberFieldType,
  textFieldType,
} from "./field-types";

describe("createFieldTypeRegistry", () => {
  it("includes the built-in types", () => {
    const registry = createFieldTypeRegistry();
    expect(registry.get("text")).toBe(textFieldType);
    expect(registry.get("email")).toBe(emailFieldType);
    expect(registry.get("date")).toBe(dateFieldType);
    expect(registry.has("select")).toBe(true);
    expect(registry.has("multiSelect")).toBe(true);
  });

  it("registers extra types", () => {
    const registry = createFieldTypeRegistry([
      {
        type: "rating",
        validate: () => undefined,
      },
    ]);
    expect(registry.has("rating")).toBe(true);
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

  it("validates minLength, maxLength, and pattern on text answers", () => {
    const registry = createFieldTypeRegistry();
    expect(
      registry.get("text")?.validate("ab", { type: "text", minLength: 3 }),
    ).toBe("Must be at least 3 characters");
    expect(textFieldType.validate("abcd", { type: "text", maxLength: 3 })).toBe(
      "Must be at most 3 characters",
    );
    expect(
      textFieldType.validate("aa", { type: "text", pattern: "^a+$" }),
    ).toBeUndefined();
    expect(
      textFieldType.validate("ab", { type: "text", pattern: "^a+$" }),
    ).toBe("Invalid format");
    expect(textFieldType.validate("aa", { type: "text", pattern: "(" })).toBe(
      "Invalid format",
    );
  });

  it("treats blank strings as empty on text", () => {
    const registry = createFieldTypeRegistry();
    expect(registry.get("text")?.isEmpty?.("  ", { type: "text" })).toBe(true);
    expect(registry.get("text")?.isEmpty?.("Ada", { type: "text" })).toBe(
      false,
    );
  });

  it("treats blank strings as empty on number and keeps zero", () => {
    expect(numberFieldType.isEmpty?.("")).toBe(true);
    expect(numberFieldType.isEmpty?.(0)).toBe(false);
    expect(
      numberFieldType.validate(0.5, { type: "number", integer: true }),
    ).toBe("Expected an integer");
    expect(numberFieldType.validate(-1, { type: "number", min: 0 })).toBe(
      "Must be at least 0",
    );
    expect(numberFieldType.validate(11, { type: "number", max: 10 })).toBe(
      "Must be at most 10",
    );
  });

  it("validates select and multiSelect options", () => {
    const registry = createFieldTypeRegistry();
    const field = {
      type: "select",
      options: [{ value: "eng" }, { value: "pm" }],
    };
    expect(registry.get("select")?.validate("eng", field)).toBeUndefined();
    expect(registry.get("select")?.validate("nope", field)).toBe(
      "Invalid option",
    );
    const multi = {
      type: "multiSelect",
      options: [{ value: "ts" }, { value: "go" }],
    };
    expect(registry.get("multiSelect")?.validate(["ts", "ts"], multi)).toBe(
      "Duplicate option",
    );
    expect(registry.get("multiSelect")?.validate(["ts", "nope"], multi)).toBe(
      "Invalid option",
    );
  });

  it("validates email and date answers", () => {
    expect(emailFieldType.validate("ada@n.com")).toBeUndefined();
    expect(emailFieldType.validate("user+tag@example.com")).toBeUndefined();
    expect(emailFieldType.validate("nope")).toBe("Expected an email");
    expect(emailFieldType.validate("ada@n")).toBe("Expected an email");
    expect(dateFieldType.validate("2026-01-02")).toBeUndefined();
    expect(dateFieldType.validate("2024-02-29")).toBeUndefined();
    expect(dateFieldType.validate("2026-02-31")).toBe("Expected a date");
    expect(dateFieldType.validate(1)).toBe("Expected a string");
  });
});
