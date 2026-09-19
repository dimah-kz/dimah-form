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
      formDefinitionSchema.validate({
        title: "Dup",
        fields: [
          { id: "name", type: "text" },
          { id: "name", type: "number" },
        ],
      }),
    ).toBe(false);
  });

  it("rejects select options with duplicate values", () => {
    expect(
      formDefinitionSchema.validate({
        title: "Dup",
        fields: [
          {
            id: "role",
            type: "select",
            options: [{ value: "a" }, { value: "a" }],
          },
        ],
      }),
    ).toBe(false);
  });

  it("rejects a select with no options", () => {
    expect(
      formDefinitionSchema.validate({
        title: "Empty",
        fields: [{ id: "role", type: "select", options: [] }],
      }),
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
      formDefinitionSchema.validate({
        title: "X",
        fields: [{ id: "n", type: "text", minLength: 8, maxLength: 2 }],
      }),
    ).toBe(false);
    expect(
      formDefinitionSchema.validate({
        title: "X",
        fields: [{ id: "n", type: "text", pattern: "(" }],
      }),
    ).toBe(false);
    expect(
      formDefinitionSchema.validate({
        title: "X",
        fields: [{ id: "age", type: "number", min: 10, max: 1 }],
      }),
    ).toBe(false);
  });

  it("keeps description and meta on the form document", () => {
    expect(
      formDefinitionSchema.parse({
        title: "X",
        description: "Hello",
        meta: { locale: "en" },
        fields: [{ id: "n", type: "text" }],
      }),
    ).toEqual({
      title: "X",
      description: "Hello",
      meta: { locale: "en" },
      fields: [{ id: "n", type: "text" }],
    });
  });

  it("rejects unknown keys on the form document", () => {
    expect(
      formDefinitionSchema.validate({
        title: "X",
        theme: "dark",
        fields: [{ id: "n", type: "text" }],
      }),
    ).toBe(false);
  });

  it("keeps meta on builtin fields and options", () => {
    expect(
      formDefinitionSchema.parse({
        title: "X",
        fields: [
          { id: "n", type: "text", meta: { placeholder: "Ada" } },
          {
            id: "role",
            type: "select",
            options: [{ value: "eng", meta: { icon: "cpu" } }],
          },
        ],
      }),
    ).toEqual({
      title: "X",
      fields: [
        { id: "n", type: "text", meta: { placeholder: "Ada" } },
        {
          id: "role",
          type: "select",
          options: [{ value: "eng", meta: { icon: "cpu" } }],
        },
      ],
    });
  });

  it("rejects unknown keys on builtin fields and options", () => {
    expect(
      formDefinitionSchema.validate({
        title: "X",
        fields: [{ id: "n", type: "text", placeholder: "Ada" }],
      }),
    ).toBe(false);
    expect(
      formDefinitionSchema.validate({
        title: "X",
        fields: [
          {
            id: "role",
            type: "select",
            options: [{ value: "eng", icon: "cpu" }],
          },
        ],
      }),
    ).toBe(false);
  });

  it("rejects non-object meta", () => {
    expect(
      formDefinitionSchema.validate({
        title: "X",
        meta: ["nope"],
        fields: [{ id: "n", type: "text" }],
      }),
    ).toBe(false);
    expect(
      formDefinitionSchema.validate({
        title: "X",
        fields: [{ id: "n", type: "text", meta: "Ada" }],
      }),
    ).toBe(false);
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
          { id: "employed", type: "boolean" },
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
        { id: "employed", type: "boolean" },
        { id: "start", type: "date", defaultValue: "2026-01-01" },
        { id: "company", showWhen: { field: "employed", equals: true } },
      ],
    });
  });

  it("rejects showWhen without equals or includes", () => {
    expect(
      formDefinitionSchema.validate({
        title: "X",
        fields: [{ id: "n", type: "text", showWhen: { field: "other" } }],
      }),
    ).toBe(false);
  });

  it("rejects showWhen that points at a missing field", () => {
    expect(
      formDefinitionSchema.validate({
        title: "Job",
        fields: [
          {
            id: "company",
            type: "text",
            showWhen: { field: "employed", equals: true },
          },
        ],
      }),
    ).toBe(false);
  });

  it("accepts a scalar list on equals", () => {
    expect(
      formDefinitionSchema.parse({
        title: "Job",
        fields: [
          {
            id: "role",
            type: "select",
            options: [{ value: "eng" }, { value: "design" }],
          },
          {
            id: "team",
            type: "text",
            showWhen: { field: "role", equals: ["eng", "design"] },
          },
        ],
      }).fields[1],
    ).toMatchObject({
      showWhen: { field: "role", equals: ["eng", "design"] },
    });
  });

  it("rejects an empty equals list", () => {
    expect(
      formDefinitionSchema.validate({
        title: "Job",
        fields: [
          { id: "role", type: "select", options: [{ value: "eng" }] },
          {
            id: "team",
            type: "text",
            showWhen: { field: "role", equals: [] },
          },
        ],
      }),
    ).toBe(false);
  });

  it("accepts all / any / notEquals showWhen", () => {
    expect(
      formDefinitionSchema.parse({
        title: "Job",
        fields: [
          {
            id: "role",
            type: "select",
            options: [{ value: "eng" }, { value: "pm" }],
          },
          {
            id: "level",
            type: "select",
            options: [{ value: "intern" }, { value: "staff" }],
          },
          {
            id: "note",
            type: "text",
            showWhen: {
              all: [
                { field: "role", equals: "eng" },
                { field: "level", notEquals: "intern" },
              ],
            },
          },
        ],
      }).fields[2],
    ).toMatchObject({
      showWhen: {
        all: [
          { field: "role", equals: "eng" },
          { field: "level", notEquals: "intern" },
        ],
      },
    });
  });

  it("rejects date min after max", () => {
    expect(
      formDefinitionSchema.validate({
        title: "X",
        fields: [
          { id: "start", type: "date", min: "2026-02-01", max: "2026-01-01" },
        ],
      }),
    ).toBe(false);
  });
});

describe("formSnapshotSchema", () => {
  it("requires a form id", () => {
    expect(formSnapshotSchema.validate(contact)).toBe(false);
    expect(
      formSnapshotSchema.parse({ id: "contact", ...contact }),
    ).toMatchObject({
      id: "contact",
      title: "Contact",
      slug: "contact",
      status: "active",
    });
    const snapshot = formSnapshotSchema.parse({
      id: "contact",
      slug: "join",
      status: "draft",
      ...contact,
    });
    expect(snapshot).toMatchObject({ slug: "join", status: "draft" });
    expect(formSnapshotSchema.encode(snapshot)).toMatchObject({
      id: "contact",
      slug: "join",
      status: "draft",
      title: "Contact",
    });
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

  it("loads a stored showWhen that points at a missing field", () => {
    expect(
      formSnapshotSchema.parse({
        id: "job",
        title: "Job",
        fields: [
          {
            id: "company",
            type: "text",
            showWhen: { field: "employed", equals: true },
          },
        ],
      }),
    ).toMatchObject({
      fields: [
        { id: "company", showWhen: { field: "employed", equals: true } },
      ],
    });
  });

  it("keeps description, meta, and timestamps on normalize", () => {
    expect(
      normalizeFormSnapshot({
        id: "intake",
        title: "Intake",
        description: "Join us",
        meta: { locale: "en" },
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
      meta: { locale: "en" },
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-02T00:00:00.000Z",
      fields: [{ id: "n", type: "text" }],
    });
  });
});
