import { describe, expect, it } from "vitest";

import {
  formDefinitionSchema,
  formSnapshotSchema,
  normalizeFormSnapshot,
} from "./definition";

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
    {
      id: "skills",
      type: "multiSelect" as const,
      options: [{ value: "ts" }, { value: "go" }],
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

  it("accepts text and number constraints", () => {
    expect(
      formDefinitionSchema.parse({
        title: "X",
        fields: [
          {
            id: "n",
            type: "text",
            minLength: 2,
            maxLength: 8,
            pattern: "^a+$",
          },
          { id: "age", type: "number", min: 1, max: 10, integer: true },
        ],
      }).fields,
    ).toMatchObject([
      { id: "n", minLength: 2, maxLength: 8, pattern: "^a+$" },
      { id: "age", min: 1, max: 10, integer: true },
    ]);
    expect(
      formDefinitionSchema.safeParse({
        title: "X",
        fields: [{ id: "n", type: "text", minLength: 8, maxLength: 2 }],
      }).success,
    ).toBe(false);
  });

  it("keeps extra keys on builtin fields and options", () => {
    expect(
      formDefinitionSchema.parse({
        title: "X",
        fields: [
          { id: "n", type: "text", placeholder: "Ada" },
          {
            id: "role",
            type: "select",
            options: [{ value: "eng", icon: "cpu" }],
          },
        ],
      }),
    ).toMatchObject({
      fields: [
        { id: "n", type: "text", placeholder: "Ada" },
        {
          id: "role",
          type: "select",
          options: [{ value: "eng", icon: "cpu" }],
        },
      ],
    });
  });

  it("keeps unknown field types on the document", () => {
    expect(
      formDefinitionSchema.parse({
        title: "X",
        fields: [{ id: "n", type: "file", pattern: ".+" }],
      }),
    ).toMatchObject({
      title: "X",
      fields: [{ id: "n", type: "file", pattern: ".+" }],
    });
  });

  it("keeps extra keys on the form document", () => {
    expect(
      formDefinitionSchema.parse({
        title: "X",
        description: "Hello",
        fields: [{ id: "n", type: "text" }],
      }),
    ).toMatchObject({
      title: "X",
      description: "Hello",
      fields: [{ id: "n", type: "text" }],
    });
  });
});

describe("formSnapshotSchema", () => {
  it("requires a form id", () => {
    expect(formSnapshotSchema.safeParse(contact).success).toBe(false);
    expect(
      formSnapshotSchema.parse({ id: "contact", ...contact }),
    ).toMatchObject({ id: "contact", title: "Contact" });
    expect(
      formSnapshotSchema.parse({
        id: "contact",
        slug: "join",
        status: "draft",
        ...contact,
      }),
    ).toMatchObject({ slug: "join", status: "draft" });
  });

  it("round-trips a custom field type", () => {
    expect(
      formSnapshotSchema.parse({
        id: "intake",
        title: "Intake",
        fields: [{ id: "file", type: "file", required: true }],
      }),
    ).toMatchObject({
      id: "intake",
      fields: [{ id: "file", type: "file", required: true }],
    });
  });

  it("parses email, date, description, defaultValue, and showWhen", () => {
    expect(
      formDefinitionSchema.parse({
        title: "Job",
        fields: [
          {
            id: "email",
            type: "email",
            required: true,
            description: "Work email",
          },
          { id: "start", type: "date", defaultValue: "2026-01-01" },
          {
            id: "company",
            type: "text",
            showWhen: { field: "employed", equals: true },
          },
        ],
      }),
    ).toMatchObject({
      fields: [
        { id: "email", type: "email", description: "Work email" },
        { id: "start", type: "date", defaultValue: "2026-01-01" },
        { id: "company", showWhen: { field: "employed", equals: true } },
      ],
    });
  });

  it("rejects showWhen without equals or includes", () => {
    expect(
      formDefinitionSchema.safeParse({
        title: "X",
        fields: [{ id: "n", type: "text", showWhen: { field: "other" } }],
      }).success,
    ).toBe(false);
  });

  it("keeps extra keys and timestamps on normalize", () => {
    expect(
      normalizeFormSnapshot({
        id: "intake",
        title: "Intake",
        description: "Join us",
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-02T00:00:00.000Z",
        fields: [{ id: "n", type: "text" }],
      }),
    ).toEqual({
      id: "intake",
      slug: "intake",
      status: "active",
      title: "Intake",
      description: "Join us",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-02T00:00:00.000Z",
      fields: [{ id: "n", type: "text" }],
    });
  });
});
