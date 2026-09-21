import { describe, expect, it } from "vitest";

import {
  defineFieldType,
  defineForm,
  normalizeFormSnapshot,
  type ResponseRecord,
} from "@dimah-form/core";

import { projectResponse } from "./project";
import { DATASET_SPEC } from "./spec";

const rating = defineFieldType({
  type: "rating",
  validate: () => undefined,
  format: (value) => (typeof value === "number" ? `${value} stars` : ""),
  $Infer: 0 as number,
});

function record(
  overrides: Partial<ResponseRecord> & Pick<ResponseRecord, "definition">,
): ResponseRecord {
  return {
    id: "r1",
    formId: overrides.definition.id,
    status: "submitted",
    answers: {},
    respondentId: "user-1",
    submittedAt: "2026-01-02T00:00:00.000Z",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-02T00:00:00.000Z",
    ...overrides,
  };
}

describe("projectResponse", () => {
  it("emits dense fields from the snapshot and omits respondentId by default", async () => {
    const definition = normalizeFormSnapshot({
      id: "contact",
      title: "Contact",
      fields: [
        { id: "name", type: "text", label: "Name" },
        { id: "ok", type: "boolean", label: "OK" },
      ],
    });
    const projected = await projectResponse(
      record({ definition, answers: { name: "Ada" } }),
    );
    expect(projected.spec).toBe(DATASET_SPEC);
    expect(projected.respondentId).toBeUndefined();
    expect(projected.updatedAt).toBe("2026-01-02T00:00:00.000Z");
    expect(projected.fields).toEqual([
      { id: "name", type: "text", value: "Ada", formatted: "Ada" },
      { id: "ok", type: "boolean", value: null, formatted: "" },
    ]);
    expect("definition" in projected).toBe(false);
    expect("answers" in projected).toBe(false);
  });

  it("formats booleans and select labels", async () => {
    const definition = normalizeFormSnapshot({
      id: "quiz",
      title: "Quiz",
      fields: [
        { id: "ok", type: "boolean" },
        {
          id: "color",
          type: "select",
          options: [
            { value: "r", label: "Red" },
            { value: "b", label: "Blue" },
          ],
        },
      ],
    });
    const projected = await projectResponse(
      record({ definition, answers: { ok: false, color: "r" } }),
    );
    expect(projected.fields[0]).toMatchObject({
      value: false,
      formatted: "No",
    });
    expect(projected.fields[1]).toMatchObject({
      value: "r",
      formatted: "Red",
    });
  });

  it("uses custom fieldTypes for formatted", async () => {
    const definition = normalizeFormSnapshot({
      id: "rate",
      title: "Rate",
      fields: [{ id: "n", type: "rating" }],
    });
    const projected = await projectResponse(
      record({ definition, answers: { n: 4 } }),
      { fieldTypes: [rating] },
    );
    expect(projected.fields[0]).toEqual({
      id: "n",
      type: "rating",
      value: 4,
      formatted: "4 stars",
    });
  });

  it("includes respondentId when asked", async () => {
    const definition = normalizeFormSnapshot({
      id: "contact",
      title: "Contact",
      fields: [{ id: "name", type: "text" }],
    });
    const projected = await projectResponse(
      record({ definition, answers: { name: "Ada" }, respondentId: "user-1" }),
      { includeRespondentId: true },
    );
    expect(projected.respondentId).toBe("user-1");
  });

  it("attaches scores without copying them into fields", async () => {
    const definition = normalizeFormSnapshot({
      id: "quiz",
      title: "Quiz",
      fields: [{ id: "q1", type: "select", options: [{ value: "1" }] }],
    });
    const projected = await projectResponse(
      record({ definition, answers: { q1: "1" } }),
      {
        scores: {
          complete: true,
          variables: {
            gad7: { raw: 3, missing: 0, complete: true },
          },
        },
      },
    );
    expect(projected.scores?.variables.gad7.raw).toBe(3);
    expect(projected.fields.map((field) => field.id)).toEqual(["q1"]);
  });

  it("projects the stored snapshot, not a later live form", async () => {
    const stored = normalizeFormSnapshot({
      id: "live",
      title: "Live",
      fields: [{ id: "name", type: "text", label: "Old" }],
    });
    const live = defineForm({
      title: "Live",
      fields: [
        { id: "name", type: "text", label: "New" },
        { id: "email", type: "email", label: "Email" },
      ],
    });
    const projected = await projectResponse(
      record({ definition: stored, answers: { name: "Ada" } }),
    );
    expect(projected.fields.map((field) => field.id)).toEqual(["name"]);
    expect(projected.fields[0]?.formatted).toBe("Ada");
    expect(live.fields.map((field) => field.id)).toEqual(["name", "email"]);
  });

  it("strips binary payload keys and records attachment metadata", async () => {
    const definition = normalizeFormSnapshot({
      id: "files",
      title: "Files",
      fields: [{ id: "file", type: "file" }],
    });
    const projected = await projectResponse(
      record({
        definition,
        answers: {
          file: { id: "abc", name: "a.png", bytes: new Uint8Array([1]) },
        },
      }),
    );
    expect(projected.fields[0]?.value).toEqual({ id: "abc", name: "a.png" });
    expect(projected.fields[0]?.attachment).toEqual({
      id: "abc",
      name: "a.png",
    });
    expect(projected.fields[0]?.formatted).toBe("a.png");
  });

  it("does not treat object answers on other types as attachments", async () => {
    const definition = normalizeFormSnapshot({
      id: "notes",
      title: "Notes",
      fields: [{ id: "note", type: "text" }],
    });
    const projected = await projectResponse(
      record({
        definition,
        answers: { note: { name: "x", bytes: [1] } },
      }),
    );
    expect(projected.fields[0]?.attachment).toBeUndefined();
    expect(projected.fields[0]?.value).toEqual({ name: "x", bytes: [1] });
  });
});
