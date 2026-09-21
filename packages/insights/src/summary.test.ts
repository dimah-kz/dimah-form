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
    definition: typeof definition;
  }> = {},
) {
  return {
    id: overrides.id ?? "r1",
    formId: "quiz",
    status: overrides.status ?? "submitted",
    definition: overrides.definition ?? definition,
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
    expect(summary.completion).toEqual({
      submitted: 2,
      complete: 2,
      rate: 1,
    });
    expect(summary.submittedAt).toEqual({
      min: "2026-01-15T00:00:00.000Z",
      max: "2026-02-01T00:00:00.000Z",
    });
    const color = summary.fields.find((field) => field.id === "color");
    expect(color?.hidden).toBe(0);
    expect(color?.n).toBe(3);
    expect(color?.unanswered).toBe(1);
    expect(summary.fields.map((field) => field.id)).toEqual([
      "color",
      "ok",
      "note",
    ]);
    expect(color?.values).toEqual([
      { value: "r", label: "Red", n: 1, pct: 0.5 },
      { value: "b", label: "Blue", n: 1, pct: 0.5 },
    ]);
    const note = summary.fields.find((field) => field.id === "note");
    expect(note?.values).toBeUndefined();
    expect(note?.unanswered).toBe(2);
  });

  it("does not count hidden showWhen fields as unanswered", () => {
    const skip = normalizeFormSnapshot({
      id: "quiz",
      title: "Quiz",
      fields: [
        { id: "employed", type: "boolean", required: true },
        {
          id: "company",
          type: "text",
          showWhen: { field: "employed", equals: true },
        },
      ],
    });
    const acc = createInsightsAccumulator("quiz");
    acc.add(
      row({
        definition: skip,
        answers: { employed: false },
      }),
    );
    acc.add(
      row({
        id: "r2",
        definition: skip,
        answers: { employed: true },
      }),
    );
    acc.add(
      row({
        id: "r3",
        definition: skip,
        answers: { employed: true, company: "Acme" },
      }),
    );
    const company = acc.finish().fields.find((field) => field.id === "company");
    expect(company).toMatchObject({
      n: 2,
      hidden: 1,
      unanswered: 1,
    });
  });

  it("folds number min/max/mean/stdev and date range", () => {
    const numericForm = normalizeFormSnapshot({
      id: "quiz",
      title: "Quiz",
      fields: [
        { id: "score", type: "number" },
        { id: "when", type: "date" },
      ],
    });
    const acc = createInsightsAccumulator("quiz");
    acc.add(
      row({
        definition: numericForm,
        answers: { score: 10, when: "2026-01-01" },
      }),
    );
    acc.add(
      row({
        id: "r2",
        definition: numericForm,
        answers: { score: 20, when: "2026-03-01" },
      }),
    );
    const summary = acc.finish();
    const score = summary.fields.find((field) => field.id === "score");
    expect(score?.numeric).toMatchObject({ min: 10, max: 20, mean: 15 });
    expect(score?.numeric?.stdev).toBeCloseTo(Math.sqrt(50));
    const when = summary.fields.find((field) => field.id === "when");
    expect(when?.dates).toEqual({ min: "2026-01-01", max: "2026-03-01" });
  });

  it("uses answered respondents as the multiSelect percentage base", () => {
    const multi = normalizeFormSnapshot({
      id: "quiz",
      title: "Quiz",
      fields: [
        {
          id: "skills",
          type: "multiSelect",
          options: [
            { value: "ts", label: "TypeScript" },
            { value: "go", label: "Go" },
          ],
        },
      ],
    });
    const acc = createInsightsAccumulator("quiz");
    acc.add(row({ definition: multi, answers: { skills: ["ts", "go"] } }));
    acc.add(row({ id: "r2", definition: multi, answers: { skills: ["ts"] } }));
    acc.add(row({ id: "r3", definition: multi, answers: {} }));
    const skills = acc.finish().fields.find((field) => field.id === "skills");
    expect(skills?.n).toBe(3);
    expect(skills?.unanswered).toBe(1);
    expect(skills?.values).toEqual([
      { value: "ts", label: "TypeScript", n: 2, pct: 1 },
      { value: "go", label: "Go", n: 1, pct: 0.5 },
    ]);
  });

  it("collects UTC day buckets when series is on", () => {
    const acc = createInsightsAccumulator("quiz", { series: true });
    acc.add(row({ submittedAt: "2026-01-15T23:00:00.000Z" }));
    acc.add(row({ id: "r2", submittedAt: "2026-01-16T01:00:00.000Z" }));
    acc.add(row({ id: "r3", status: "draft", submittedAt: null, answers: {} }));
    expect(acc.finish().series).toEqual({
      bucket: "day",
      points: [
        { t: "2026-01-15", n: 1 },
        { t: "2026-01-16", n: 1 },
      ],
    });
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
    expect(variable?.stdev).toBeCloseTo(Math.sqrt(32));
    expect(variable?.bands).toEqual([
      { label: "Mild", n: 1, pct: 0.5 },
      { label: "Moderate", n: 1, pct: 0.5 },
    ]);
  });

  it("keeps unused options and bands in document order", () => {
    const scored = normalizeFormSnapshot({
      id: "quiz",
      title: "Quiz",
      meta: {
        scoring: {
          variables: [
            { id: "pulse", label: "Pulse" },
            { id: "gad7", label: "GAD-7" },
          ],
          bands: [
            { variable: "gad7", label: "Mild" },
            { variable: "gad7", label: "Moderate" },
            { variable: "gad7", label: "Severe" },
          ],
        },
      },
      fields: [
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
    const acc = createInsightsAccumulator("quiz");
    acc.add(row({ definition: scored, answers: { color: "r" } }), {
      variables: {
        gad7: { raw: 12, complete: true, band: "Moderate" },
        pulse: { raw: 1, complete: true },
      },
    });
    const summary = acc.finish();
    expect(
      summary.fields.find((field) => field.id === "color")?.values,
    ).toEqual([
      { value: "r", label: "Red", n: 1, pct: 1 },
      { value: "b", label: "Blue", n: 0, pct: 0 },
    ]);
    expect(summary.scores?.variables.map((variable) => variable.id)).toEqual([
      "pulse",
      "gad7",
    ]);
    expect(summary.scores?.variables[1]?.bands).toEqual([
      { label: "Mild", n: 0, pct: 0 },
      { label: "Moderate", n: 1, pct: 1 },
      { label: "Severe", n: 0, pct: 0 },
    ]);
  });

  it("orders seen fields by the live document and does not invent fields", () => {
    const acc = createInsightsAccumulator("quiz", {
      liveFields: [
        { id: "note", type: "text", label: "Note" },
        {
          id: "color",
          type: "select",
          label: "Color",
          options: [
            { value: "r", label: "Red" },
            { value: "b", label: "Blue" },
            { value: "g", label: "Green" },
          ],
        },
        { id: "email", type: "email", label: "Email" },
      ],
    });
    acc.add(row());
    const summary = acc.finish();
    expect(summary.fields.map((field) => field.id)).toEqual([
      "note",
      "color",
      "ok",
    ]);
    expect(
      summary.fields.find((field) => field.id === "color")?.values,
    ).toEqual([
      { value: "r", label: "Red", n: 1, pct: 1 },
      { value: "b", label: "Blue", n: 0, pct: 0 },
      { value: "g", label: "Green", n: 0, pct: 0 },
    ]);
  });

  it("folds finite numbers on custom field types without value buckets", () => {
    const rated = normalizeFormSnapshot({
      id: "quiz",
      title: "Quiz",
      fields: [{ id: "stars", type: "rating" }],
    });
    const acc = createInsightsAccumulator("quiz");
    acc.add(row({ definition: rated, answers: { stars: 4 } }));
    acc.add(row({ id: "r2", definition: rated, answers: { stars: 2 } }));
    const stars = acc.finish().fields.find((field) => field.id === "stars");
    expect(stars?.values).toBeUndefined();
    expect(stars?.numeric).toMatchObject({ min: 2, max: 4, mean: 3 });
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
