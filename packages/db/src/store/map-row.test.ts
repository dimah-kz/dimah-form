import { describe, expect, it } from "vitest";

import {
  toFormSnapshot,
  toQuestionnaireColumns,
  toResponseRecord,
} from "./map-row";

const record = {
  id: "resp-1",
  formId: "onboarding",
  status: "draft" as const,
  definition: {
    id: "onboarding",
    title: "Onboarding",
    fields: [{ id: "name", type: "text" as const, required: true }],
  },
  answers: { name: "Ada" },
  respondentId: null,
  submittedAt: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-02T00:00:00.000Z",
};

describe("map-row", () => {
  it("round-trips a response row", () => {
    expect(
      toResponseRecord({
        id: record.id,
        questionnaireId: record.formId,
        status: record.status,
        definition: record.definition,
        answers: record.answers,
        respondentId: null,
        submittedAt: null,
        createdAt: new Date(record.createdAt),
        updatedAt: new Date(record.updatedAt),
      }),
    ).toEqual(record);
  });

  it("round-trips a custom field type on the snapshot", () => {
    expect(
      toResponseRecord({
        id: "resp-2",
        questionnaireId: "intake",
        status: "draft",
        definition: {
          id: "intake",
          title: "Intake",
          fields: [{ id: "email", type: "email", required: true }],
        },
        answers: {},
        respondentId: null,
        submittedAt: null,
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
        updatedAt: new Date("2026-01-01T00:00:00.000Z"),
      }).definition.fields,
    ).toEqual([{ id: "email", type: "email", required: true }]);
  });

  it("maps the parent questionnaire from the snapshot", () => {
    expect(
      toQuestionnaireColumns(record.definition, new Date(record.updatedAt)),
    ).toMatchObject({
      id: "onboarding",
      slug: "onboarding",
      title: "Onboarding",
      definition: {
        title: "Onboarding",
        fields: record.definition.fields,
      },
      status: "active",
    });
  });

  it("maps a questionnaire row to a live snapshot", () => {
    expect(
      toFormSnapshot({
        id: "intake",
        title: "Intake",
        definition: {
          title: "Intake",
          fields: [{ id: "email", type: "email", required: true }],
        },
        status: "active",
      }),
    ).toEqual({
      id: "intake",
      title: "Intake",
      fields: [{ id: "email", type: "email", required: true }],
    });
  });

  it("keeps extra keys on builtin fields", () => {
    expect(
      toFormSnapshot({
        id: "intake",
        title: "Intake",
        definition: {
          title: "Intake",
          fields: [{ id: "name", type: "text", placeholder: "Ada" }],
        },
        status: "active",
      }).fields,
    ).toEqual([{ id: "name", type: "text", placeholder: "Ada" }]);
  });
});
