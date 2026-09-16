import { describe, expect, it } from "vitest";
import * as z from "zod";

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

  it("keeps description and meta on the form document", () => {
    const form = defineForm({
      title: "Contact",
      description: "Hello",
      meta: { locale: "en" },
      fields: [{ id: "name", type: "text" }],
    });
    expect(form.description).toBe("Hello");
    expect(form.meta).toEqual({ locale: "en" });
  });

  it("keeps meta on builtin fields", () => {
    const form = defineForm({
      title: "Contact",
      fields: [{ id: "name", type: "text", meta: { placeholder: "Ada" } }],
    });
    expect(form.fields[0]).toMatchObject({
      meta: { placeholder: "Ada" },
    });
  });

  it("allows unknown field types in the document", () => {
    const form = defineForm({
      title: "Intake",
      fields: [{ id: "file", type: "file", required: true }],
    });
    expect(form.fields[0]?.type).toBe("file");
  });
});

describe("defineFieldType", () => {
  it("returns the descriptor", () => {
    const handle = defineFieldType({
      type: "handle",
      validate: (value, _field) =>
        typeof value === "string" ? undefined : "Expected a handle",
      $Infer: "" as string,
    });
    expect(handle.type).toBe("handle");
    expect(handle.validate("@ada", { type: "handle" })).toBeUndefined();
  });

  it("accepts a field document schema", () => {
    const handle = defineFieldType({
      type: "handle",
      fieldSchema: z.looseObject({ type: z.literal("handle") }),
      validate: () => undefined,
    });
    expect(handle.fieldSchema?.safeParse({ type: "handle" }).success).toBe(
      true,
    );
  });
});
