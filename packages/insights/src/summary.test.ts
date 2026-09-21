import { defineForm, normalizeFormSnapshot } from "@dimah-form/core";
import { describe, expect, it } from "vitest";

import { createInsightsAccumulator } from "./summary";

const definition = normalizeFormSnapshot({
  id: "quiz",
  title: "Quiz",
  fields: [
    {
      id: "color",
      type: "select",
      required: true,
      options: [
        { value: "r", label: "Red" },
        { value: "b", label: "Blue" },
      ],
    },
    { id: "ok", type: "boolean" },
    { id: "note", type: "text" },
  ],
});

function row(
  overrides: Partial<{
    id: string;
    status: "draft" | "submitted" | "abandoned";
    answers: Record<string, unknown>;
    submittedAt: string | null;
  }> = {},
) {
  return {
    id: overrides.id ?? "r1",
    formId: "quiz",
    status: overrides.status ?? "submitted",
    definition,
    answers: overrides.answers ?? { color: "r", ok: true, note: "hi" },
    respondentId: null,
    submittedAt:
      overrides.submittedAt === undefined
        ? "2026-01-15T00:00:00.000Z"
        : overrides.submittedAt,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-15T00:00:00.000Z",
  };
}

describe("createInsightsAccumulator", () => {
  it("counts status, completion, and categorical values from snapshots", () => {
    const acc = createInsightsAccumulator("quiz");
    acc.add(row());
    acc.add(
      row({
        id: "r2",
        answers: { color: "b", ok: false },
        submittedAt: "2026-02-01T00:00:00.000Z",
      }),
    );
    acc.add(row({ id: "r3", status: "draft", submittedAt: null, answers: {} }));
    const summary = acc.finish();
    expect(summary.total).toBe(3);
    expect(summary.byStatus).toEqual({
      draft: 1,
      submitted: 2,
      abandoned: 0,
    });
    expect(summary.completion).toEqual({ submitted: 2, complete: 2 });
    expect(summary.submittedAt).toEqual({
      min: "2026-01-15T00:00:00.000Z",
      max: "2026-02-01T00:00:00.000Z",
    });
    const color = summary.fields.find((field) => field.id === "color");
    expect(color?.values).toEqual([
      { value: "b", label: "Blue", n: 1 },
      { value: "r", label: "Red", n: 1 },
    ]);
    expect(color?.unanswered).toBe(1);
    const note = summary.fields.find((field) => field.id === "note");
    expect(note?.values).toBeUndefined();
    expect(note?.unanswered).toBe(2);
  });

  it("folds score bands without writing them into field counts", () => {
    const acc = createInsightsAccumulator("quiz");
    acc.add(row(), {
      variables: {
        gad7: {
          raw: 4,
          complete: true,
          band: "Mild",
          label: "GAD-7",
        },
      },
    });
    acc.add(row({ id: "r2" }), {
      variables: {
        gad7: { raw: 12, complete: true, band: "Moderate", label: "GAD-7" },
      },
    });
    const variable = acc.finish().scores?.variables[0];
    expect(variable).toMatchObject({
      id: "gad7",
      label: "GAD-7",
      n: 2,
      complete: 2,
      min: 4,
      max: 12,
      mean: 8,
    });
    expect(variable?.bands).toEqual([
      { label: "Mild", n: 1 },
      { label: "Moderate", n: 1 },
    ]);
  });
});

describe("defineForm snapshots stay out of live merge", () => {
  it("does not invent live-only fields", () => {
    const stored = normalizeFormSnapshot({
      id: "live",
      title: "Live",
      fields: [{ id: "name", type: "select", options: [{ value: "a" }] }],
    });
    const live = defineForm({
      title: "Live",
      fields: [
        { id: "name", type: "select", options: [{ value: "a" }] },
        { id: "email", type: "email" },
      ],
    });
    const acc = createInsightsAccumulator("live");
    acc.add({
      ...row({ answers: { name: "a" } }),
      formId: "live",
      definition: stored,
    });
    expect(acc.finish().fields.map((field) => field.id)).toEqual(["name"]);
    expect(live.fields.map((field) => field.id)).toEqual(["name", "email"]);
  });
});
