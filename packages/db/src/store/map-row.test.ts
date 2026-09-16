import { describe, expect, it } from "vitest";

import { toQuestionnaireColumns, toResponseRecord } from "./map-row";

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
        respondentId: null,
        scope: null,
        definition: record.definition,
        answers: record.answers,
        submittedAt: null,
        createdAt: new Date(record.createdAt),
        updatedAt: new Date(record.updatedAt),
      }),
    ).toEqual(record);
  });

  it("maps the parent questionnaire from the snapshot", () => {
    expect(toQuestionnaireColumns(record)).toMatchObject({
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
});
