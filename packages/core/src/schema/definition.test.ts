import { describe, expect, it } from "vitest";

import { formDefinitionSchema, formSnapshotSchema } from "./definition";

const contact = {
  title: "Contact",
  fields: [
    { id: "name", type: "text" as const, required: true, label: "Name" },
    { id: "age", type: "number" as const },
    { id: "ok", type: "boolean" as const, required: true },
    {
      id: "role",
      type: "select" as const,
      options: [{ value: "eng", label: "Engineer" }, { value: "pm" }],
    },
  ],
};

describe("formDefinitionSchema", () => {
  it("parses a document with the v0 field types", () => {
    expect(formDefinitionSchema.parse(contact)).toEqual({
      title: "Contact",
      fields: contact.fields,
    });
  });

  it("trims title and field ids", () => {
    expect(
      formDefinitionSchema.parse({
        title: "  Hello  ",
        fields: [{ id: "  name  ", type: "text" }],
      }),
    ).toEqual({
      title: "Hello",
      fields: [{ id: "name", type: "text" }],
    });
  });

  it("rejects duplicate field ids", () => {
    expect(
      formDefinitionSchema.safeParse({
        title: "Dup",
        fields: [
          { id: "name", type: "text" },
          { id: "name", type: "number" },
        ],
      }).success,
    ).toBe(false);
  });

  it("rejects select options with duplicate values", () => {
    expect(
      formDefinitionSchema.safeParse({
        title: "Dup",
        fields: [
          {
            id: "role",
            type: "select",
            options: [{ value: "a" }, { value: "a" }],
          },
        ],
      }).success,
    ).toBe(false);
  });

  it("rejects a select with no options", () => {
    expect(
      formDefinitionSchema.safeParse({
        title: "Empty",
        fields: [{ id: "role", type: "select", options: [] }],
      }).success,
    ).toBe(false);
  });

  it("rejects unknown field types", () => {
    expect(
      formDefinitionSchema.safeParse({
        title: "X",
        fields: [{ id: "n", type: "file" }],
      }).success,
    ).toBe(false);
  });
});

describe("formSnapshotSchema", () => {
  it("requires a form id", () => {
    expect(formSnapshotSchema.safeParse(contact).success).toBe(false);
    expect(
      formSnapshotSchema.parse({ id: "contact", ...contact }),
    ).toMatchObject({ id: "contact", title: "Contact" });
  });
});
