import {
  defineForm,
  isFormErrorCode,
  normalizeFormSnapshot,
  type FormAnswers,
} from "@dimah-form/core";
import { describe, expect, it } from "vitest";

import { collectScoringIssues, scoreResponse } from "./score";

const likert = [
  { value: "0", label: "Not at all", meta: { scoring: { points: 0 } } },
  { value: "1", label: "Several days", meta: { scoring: { points: 1 } } },
  {
    value: "2",
    label: "More than half the days",
    meta: { scoring: { points: 2 } },
  },
  { value: "3", label: "Nearly every day", meta: { scoring: { points: 3 } } },
];

function item(
  id: string,
  extra?: { reverse?: boolean; showWhen?: { field: string; equals: string } },
) {
  return {
    id,
    type: "select" as const,
    options: likert,
    ...(extra?.showWhen ? { showWhen: extra.showWhen } : {}),
    meta: {
      scoring: {
        variable: "gad7",
        ...(extra?.reverse ? { reverse: true } : {}),
      },
    },
  };
}

function gad7(overrides?: {
  missing?: "zero" | "omit" | "incomplete";
  fields?: ReturnType<typeof item>[];
  extraFields?: Record<string, unknown>[];
}) {
  const fields = overrides?.fields ?? [
    item("q1"),
    item("q2"),
    item("q3"),
    item("q4"),
    item("q5"),
    item("q6"),
    item("q7"),
  ];
  return normalizeFormSnapshot({
    id: "gad7",
    ...defineForm({
      title: "GAD-7",
      meta: {
        scoring: {
          variables: [
            {
              id: "gad7",
              label: "GAD-7",
              min: 0,
              max: 21,
              ...(overrides?.missing ? { missing: overrides.missing } : {}),
            },
          ],
          bands: [
            { variable: "gad7", from: 0, to: 4, label: "Minimal" },
            { variable: "gad7", from: 5, to: 9, label: "Mild" },
            { variable: "gad7", from: 10, to: 14, label: "Moderate" },
            { variable: "gad7", from: 15, to: 21, label: "Severe" },
          ],
        },
      },
      fields: [...fields, ...(overrides?.extraFields ?? [])] as never,
    }),
  });
}

const allTwos: FormAnswers = {
  q1: "2",
  q2: "2",
  q3: "2",
  q4: "2",
  q5: "2",
  q6: "2",
  q7: "2",
};

describe("scoreResponse", () => {
  it("sums GAD-7 select points and assigns a band", () => {
    const result = scoreResponse(gad7(), allTwos);
    expect(result.complete).toBe(true);
    expect(result.variables.gad7).toMatchObject({
      raw: 14,
      min: 0,
      max: 21,
      missing: 0,
      complete: true,
      label: "GAD-7",
      band: "Moderate",
    });
  });

  it("reverses a select item using option min + max - points", () => {
    const definition = gad7({
      fields: [item("q1", { reverse: true }), item("q2")],
    });
    const result = scoreResponse(definition, { q1: "0", q2: "3" });
    expect(result.variables.gad7.raw).toBe(6);
  });

  it("excludes hidden showWhen fields from the sum and missing count", () => {
    const definition = gad7({
      fields: [
        item("q1"),
        item("q2", { showWhen: { field: "q1", equals: "3" } }),
      ],
    });
    const hidden = scoreResponse(definition, { q1: "0", q2: "3" });
    expect(hidden.variables.gad7).toMatchObject({
      raw: 0,
      missing: 0,
      complete: true,
    });
    const shown = scoreResponse(definition, { q1: "3", q2: "3" });
    expect(shown.variables.gad7).toMatchObject({
      raw: 6,
      missing: 0,
      complete: true,
    });
  });

  it("treats unanswered optional items as 0 when missing is zero", () => {
    const result = scoreResponse(gad7({ missing: "zero" }), { q1: "3" });
    expect(result.complete).toBe(true);
    expect(result.variables.gad7).toMatchObject({
      raw: 3,
      missing: 6,
      complete: true,
    });
  });

  it("omits unanswered items and returns null when none are present", () => {
    const partial = scoreResponse(gad7({ missing: "omit" }), { q1: "3" });
    expect(partial.complete).toBe(true);
    expect(partial.variables.gad7).toMatchObject({ raw: 3, missing: 6 });
    const empty = scoreResponse(gad7({ missing: "omit" }), {});
    expect(empty.complete).toBe(false);
    expect(empty.variables.gad7).toMatchObject({ raw: null, missing: 7 });
  });

  it("defaults missing to incomplete", () => {
    const result = scoreResponse(gad7(), { q1: "3" });
    expect(result.complete).toBe(false);
    expect(result.variables.gad7).toMatchObject({
      raw: null,
      missing: 6,
      complete: false,
    });
    expect(scoreResponse(gad7(), { q1: "" }).variables.gad7.missing).toBe(7);
  });

  it("scores number fields as the numeric value", () => {
    const definition = normalizeFormSnapshot({
      id: "n",
      ...defineForm({
        title: "N",
        meta: {
          scoring: { variables: [{ id: "hours", min: 0, max: 10 }] },
        },
        fields: [
          {
            id: "hours",
            type: "number",
            meta: { scoring: { variable: "hours" } },
          },
        ],
      }),
    });
    expect(scoreResponse(definition, { hours: 4 }).variables.hours.raw).toBe(4);
    expect(
      scoreResponse(definition, { hours: 0 }).variables.hours,
    ).toMatchObject({
      raw: 0,
      missing: 0,
      complete: true,
    });
  });

  it("reverses number fields with variable min/max", () => {
    const definition = normalizeFormSnapshot({
      id: "n",
      ...defineForm({
        title: "N",
        meta: {
          scoring: { variables: [{ id: "hours", min: 0, max: 10 }] },
        },
        fields: [
          {
            id: "hours",
            type: "number",
            meta: { scoring: { variable: "hours", reverse: true } },
          },
        ],
      }),
    });
    expect(scoreResponse(definition, { hours: 2 }).variables.hours.raw).toBe(8);
  });

  it("scores boolean as 1/0 and reverse as 1 - value", () => {
    const definition = normalizeFormSnapshot({
      id: "b",
      ...defineForm({
        title: "B",
        meta: { scoring: { variables: [{ id: "ok" }] } },
        fields: [
          {
            id: "ok",
            type: "boolean",
            meta: { scoring: { variable: "ok" } },
          },
          {
            id: "flag",
            type: "boolean",
            meta: { scoring: { variable: "ok", reverse: true } },
          },
        ],
      }),
    });
    expect(
      scoreResponse(definition, { ok: true, flag: true }).variables.ok.raw,
    ).toBe(1);
    expect(
      scoreResponse(definition, { ok: false, flag: false }).variables.ok.raw,
    ).toBe(1);
    const single = normalizeFormSnapshot({
      id: "b1",
      ...defineForm({
        title: "B1",
        meta: { scoring: { variables: [{ id: "ok" }] } },
        fields: [
          {
            id: "ok",
            type: "boolean",
            meta: { scoring: { variable: "ok" } },
          },
        ],
      }),
    });
    expect(scoreResponse(single, { ok: false }).variables.ok).toMatchObject({
      raw: 0,
      missing: 0,
      complete: true,
    });
  });

  it("sums multiSelect option points", () => {
    const definition = normalizeFormSnapshot({
      id: "m",
      ...defineForm({
        title: "M",
        meta: { scoring: { variables: [{ id: "total" }] } },
        fields: [
          {
            id: "picks",
            type: "multiSelect",
            meta: { scoring: { variable: "total" } },
            options: [
              { value: "a", meta: { scoring: { points: 1 } } },
              { value: "b", meta: { scoring: { points: 2 } } },
              { value: "c", meta: { scoring: { points: 4 } } },
            ],
          },
        ],
      }),
    });
    expect(
      scoreResponse(definition, { picks: ["a", "c"] }).variables.total.raw,
    ).toBe(5);
    expect(scoreResponse(definition, { picks: [] }).variables.total.raw).toBe(
      0,
    );
    expect(scoreResponse(definition, {}).variables.total).toMatchObject({
      raw: null,
      missing: 1,
      complete: false,
    });
  });

  it("reverses each selected multiSelect option using option min + max", () => {
    const definition = normalizeFormSnapshot({
      id: "m",
      ...defineForm({
        title: "M",
        meta: { scoring: { variables: [{ id: "total" }] } },
        fields: [
          {
            id: "picks",
            type: "multiSelect",
            meta: { scoring: { variable: "total", reverse: true } },
            options: [
              { value: "a", meta: { scoring: { points: 1 } } },
              { value: "b", meta: { scoring: { points: 2 } } },
              { value: "c", meta: { scoring: { points: 4 } } },
            ],
          },
        ],
      }),
    });
    // min 1, max 4 → reverse(2) = 3
    expect(
      scoreResponse(definition, { picks: ["b"] }).variables.total.raw,
    ).toBe(3);
  });

  it("uses the snapshot you pass, not a live questionnaire", () => {
    const started = gad7();
    const live = gad7({
      fields: [item("q1"), item("q2")],
    });
    const result = scoreResponse(started, allTwos);
    expect(result.variables.gad7.raw).toBe(14);
    expect(scoreResponse(live, { q1: "3", q2: "3" }).variables.gad7.raw).toBe(
      6,
    );
  });

  it("is a no-op when meta.scoring is absent", () => {
    const definition = normalizeFormSnapshot({
      id: "plain",
      ...defineForm({
        title: "Plain",
        fields: [{ id: "n", type: "text" }],
      }),
    });
    expect(scoreResponse(definition, { n: "Ada" })).toEqual({
      variables: {},
      complete: true,
    });
    expect(collectScoringIssues(definition)).toEqual([]);
  });

  it("sums formulas from variable raws", () => {
    const definition = normalizeFormSnapshot({
      id: "f",
      ...defineForm({
        title: "F",
        meta: {
          scoring: {
            variables: [
              { id: "a", max: 3 },
              { id: "b", max: 3 },
            ],
            formulas: [{ id: "total", op: "sum", vars: ["a", "b"] }],
            bands: [{ variable: "total", from: 4, label: "High" }],
          },
        },
        fields: [
          {
            id: "q1",
            type: "select",
            options: likert,
            meta: { scoring: { variable: "a" } },
          },
          {
            id: "q2",
            type: "select",
            options: likert,
            meta: { scoring: { variable: "b" } },
          },
        ],
      }),
    });
    const result = scoreResponse(definition, { q1: "2", q2: "3" });
    expect(result.variables.a.raw).toBe(2);
    expect(result.variables.b.raw).toBe(3);
    expect(result.variables.total).toMatchObject({
      raw: 5,
      max: 6,
      band: "High",
      complete: true,
    });
  });

  it("leaves a formula incomplete when a source variable is incomplete", () => {
    const definition = normalizeFormSnapshot({
      id: "f",
      ...defineForm({
        title: "F",
        meta: {
          scoring: {
            variables: [{ id: "a" }, { id: "b" }],
            formulas: [{ id: "total", op: "sum", vars: ["a", "b"] }],
          },
        },
        fields: [
          {
            id: "q1",
            type: "select",
            options: likert,
            meta: { scoring: { variable: "a" } },
          },
          {
            id: "q2",
            type: "select",
            options: likert,
            meta: { scoring: { variable: "b" } },
          },
        ],
      }),
    });
    const result = scoreResponse(definition, { q1: "2" });
    expect(result.variables.a.raw).toBe(2);
    expect(result.variables.b).toMatchObject({ raw: null, complete: false });
    expect(result.variables.total).toMatchObject({
      raw: null,
      complete: false,
      missing: 1,
    });
    expect(result.complete).toBe(false);
  });

  it("keys selected options into named variables via option add", () => {
    const definition = normalizeFormSnapshot({
      id: "key",
      ...defineForm({
        title: "Key",
        meta: {
          scoring: {
            variables: [{ id: "x" }, { id: "y" }, { id: "z" }],
          },
        },
        fields: [
          {
            id: "q1",
            type: "select",
            options: [
              {
                value: "a",
                meta: {
                  scoring: { add: [{ variable: "x", points: 2 }] },
                },
              },
              {
                value: "b",
                meta: {
                  scoring: { add: [{ variable: "y", points: 3 }] },
                },
              },
              {
                value: "c",
                meta: {
                  scoring: {
                    add: [
                      { variable: "x", points: 1 },
                      { variable: "z", points: 4 },
                    ],
                  },
                },
              },
            ],
          },
        ],
      }),
    });
    expect(scoreResponse(definition, { q1: "a" }).variables).toMatchObject({
      x: { raw: 2, missing: 0, complete: true },
      y: { raw: 0, missing: 0, complete: true },
      z: { raw: 0, missing: 0, complete: true },
    });
    expect(scoreResponse(definition, { q1: "c" }).variables).toMatchObject({
      x: { raw: 1 },
      y: { raw: 0 },
      z: { raw: 4 },
    });
    expect(scoreResponse(definition, {}).variables).toMatchObject({
      x: { raw: null, missing: 1, complete: false },
      y: { raw: null, missing: 1, complete: false },
      z: { raw: null, missing: 1, complete: false },
    });
  });

  it("sums multiSelect option add across variables", () => {
    const definition = normalizeFormSnapshot({
      id: "ms",
      ...defineForm({
        title: "MS",
        meta: {
          scoring: {
            variables: [{ id: "depression" }, { id: "anxiety" }],
          },
        },
        fields: [
          {
            id: "symptoms",
            type: "multiSelect",
            options: [
              {
                value: "sad",
                meta: {
                  scoring: { add: [{ variable: "depression", points: 1 }] },
                },
              },
              {
                value: "panic",
                meta: {
                  scoring: { add: [{ variable: "anxiety", points: 2 }] },
                },
              },
              {
                value: "insomnia",
                meta: {
                  scoring: {
                    add: [
                      { variable: "depression", points: 1 },
                      { variable: "anxiety", points: 1 },
                    ],
                  },
                },
              },
            ],
          },
        ],
      }),
    });
    expect(
      scoreResponse(definition, { symptoms: ["sad", "insomnia"] }).variables,
    ).toMatchObject({
      depression: { raw: 2, complete: true },
      anxiety: { raw: 1, complete: true },
    });
    expect(
      scoreResponse(definition, { symptoms: [] }).variables.depression.raw,
    ).toBe(0);
  });

  it("does not count a hidden keying field as missing", () => {
    const definition = normalizeFormSnapshot({
      id: "hide",
      ...defineForm({
        title: "Hide",
        meta: { scoring: { variables: [{ id: "x" }, { id: "y" }] } },
        fields: [
          {
            id: "gate",
            type: "select",
            options: [{ value: "show" }, { value: "hide" }],
          },
          {
            id: "q1",
            type: "select",
            showWhen: { field: "gate", equals: "show" },
            options: [
              {
                value: "a",
                meta: { scoring: { add: [{ variable: "x", points: 2 }] } },
              },
              {
                value: "b",
                meta: { scoring: { add: [{ variable: "y", points: 2 }] } },
              },
            ],
          },
        ],
      }),
    });
    expect(scoreResponse(definition, { gate: "hide" }).variables).toMatchObject(
      {
        x: { raw: 0, missing: 0, complete: true },
        y: { raw: 0, missing: 0, complete: true },
      },
    );
  });

  it("assigns the first matching band and treats omitted from/to as open ends", () => {
    const overlapping = gad7();
    overlapping.meta = {
      scoring: {
        variables: [{ id: "gad7", min: 0, max: 21 }],
        bands: [
          { variable: "gad7", from: 0, to: 14, label: "First" },
          { variable: "gad7", from: 10, to: 14, label: "Second" },
        ],
      },
    };
    expect(scoreResponse(overlapping, allTwos).variables.gad7.band).toBe(
      "First",
    );

    const open = gad7();
    open.meta = {
      scoring: {
        variables: [{ id: "gad7", min: 0, max: 21 }],
        bands: [{ variable: "gad7", from: 15, label: "Severe" }],
      },
    };
    expect(scoreResponse(open, allTwos).variables.gad7.band).toBeUndefined();
    expect(
      scoreResponse(open, {
        q1: "3",
        q2: "3",
        q3: "3",
        q4: "3",
        q5: "3",
        q6: "0",
        q7: "0",
      }).variables.gad7.band,
    ).toBe("Severe");
  });
});

describe("collectScoringIssues", () => {
  it("reports unknown variables, missing option points, and unsupported types", () => {
    const definition = normalizeFormSnapshot({
      id: "bad",
      ...defineForm({
        title: "Bad",
        meta: { scoring: { variables: [{ id: "gad7" }] } },
        fields: [
          {
            id: "q1",
            type: "select",
            options: [{ value: "0" }],
            meta: { scoring: { variable: "nope" } },
          },
          {
            id: "note",
            type: "text",
            meta: { scoring: { variable: "gad7" } },
          },
        ],
      }),
    });
    const codes = collectScoringIssues(definition).map((issue) => issue.code);
    expect(codes).toContain("SCORING_UNKNOWN_VARIABLE");
    expect(codes).toContain("SCORING_MISSING_POINTS");
    expect(codes).toContain("SCORING_UNSUPPORTED_TYPE");
  });

  it("rejects field scoring when form meta.scoring is absent", () => {
    const definition = normalizeFormSnapshot({
      id: "plain",
      ...defineForm({
        title: "Plain",
        fields: [
          {
            id: "q1",
            type: "select",
            options: [{ value: "0", meta: { scoring: { points: 0 } } }],
            meta: { scoring: { variable: "gad7" } },
          },
        ],
      }),
    });
    const codes = collectScoringIssues(definition).map((issue) => issue.code);
    expect(codes).toContain("SCORING_FORM_REQUIRED");
  });

  it("throws those codes from scoreResponse", () => {
    const definition = normalizeFormSnapshot({
      id: "bad",
      ...defineForm({
        title: "Bad",
        meta: { scoring: { variables: [{ id: "gad7" }] } },
        fields: [
          {
            id: "q1",
            type: "select",
            options: [{ value: "0", meta: { scoring: { points: 0 } } }],
            meta: { scoring: { variable: "missing" } },
          },
        ],
      }),
    });
    expect(() => scoreResponse(definition, { q1: "0" })).toThrow();
    let error: unknown;
    try {
      scoreResponse(definition, { q1: "0" });
    } catch (caught) {
      error = caught;
    }
    expect(isFormErrorCode(error, "SCORING_UNKNOWN_VARIABLE")).toBe(true);
  });

  it("rejects option scoring when form meta.scoring is absent", () => {
    const definition = normalizeFormSnapshot({
      id: "plain",
      ...defineForm({
        title: "Plain",
        fields: [
          {
            id: "q1",
            type: "select",
            options: [{ value: "0", meta: { scoring: { points: 0 } } }],
          },
        ],
      }),
    });
    const codes = collectScoringIssues(definition).map((issue) => issue.code);
    expect(codes).toContain("SCORING_FORM_REQUIRED");
  });

  it("rejects duplicate variable and formula ids", () => {
    const definition = normalizeFormSnapshot({
      id: "dup",
      ...defineForm({
        title: "Dup",
        meta: {
          scoring: {
            variables: [{ id: "gad7" }, { id: "gad7" }],
            formulas: [{ id: "gad7", op: "sum", vars: ["gad7"] }],
          },
        },
        fields: [{ id: "n", type: "text" }],
      }),
    });
    const codes = collectScoringIssues(definition).map((issue) => issue.code);
    expect(codes).toContain("SCORING_DUPLICATE_VARIABLE");
    expect(codes).toContain("SCORING_DUPLICATE_FORMULA");
  });

  it("rejects formula vars that are not variables, including other formulas", () => {
    const definition = normalizeFormSnapshot({
      id: "f",
      ...defineForm({
        title: "F",
        meta: {
          scoring: {
            variables: [{ id: "a" }, { id: "b" }],
            formulas: [
              { id: "ab", op: "sum", vars: ["a", "b"] },
              { id: "total", op: "sum", vars: ["ab"] },
            ],
          },
        },
        fields: [
          {
            id: "q1",
            type: "select",
            options: likert,
            meta: { scoring: { variable: "a" } },
          },
        ],
      }),
    });
    const issues = collectScoringIssues(definition);
    expect(issues.map((issue) => issue.code)).toContain(
      "SCORING_FORMULA_UNKNOWN_VAR",
    );
    expect(issues.some((issue) => issue.params?.variable === "ab")).toBe(true);
  });

  it("rejects unknown band variables, inverted bands, and reverse without a range", () => {
    const definition = normalizeFormSnapshot({
      id: "bad",
      ...defineForm({
        title: "Bad",
        meta: {
          scoring: {
            variables: [{ id: "hours" }, { id: "ok" }],
            bands: [
              { variable: "hours", from: 4, to: 1, label: "Backwards" },
              { variable: "missing", from: 0, label: "Ghost" },
            ],
          },
        },
        fields: [
          {
            id: "hours",
            type: "number",
            meta: { scoring: { variable: "hours", reverse: true } },
          },
        ],
      }),
    });
    const codes = collectScoringIssues(definition).map((issue) => issue.code);
    expect(codes).toContain("SCORING_INVALID_BAND");
    expect(codes).toContain("SCORING_UNKNOWN_BAND_VARIABLE");
    expect(codes).toContain("SCORING_REVERSE_RANGE");
  });

  it("rejects mixing field variable with option add, and points without a field variable", () => {
    const mixed = normalizeFormSnapshot({
      id: "mix",
      ...defineForm({
        title: "Mix",
        meta: { scoring: { variables: [{ id: "x" }, { id: "y" }] } },
        fields: [
          {
            id: "q1",
            type: "select",
            options: [
              {
                value: "a",
                meta: { scoring: { add: [{ variable: "y", points: 1 }] } },
              },
            ],
            meta: { scoring: { variable: "x" } },
          },
        ],
      }),
    });
    expect(collectScoringIssues(mixed).map((issue) => issue.code)).toContain(
      "SCORING_OPTION_ADD_MIX",
    );

    const orphan = normalizeFormSnapshot({
      id: "orphan",
      ...defineForm({
        title: "Orphan",
        meta: { scoring: { variables: [{ id: "x" }] } },
        fields: [
          {
            id: "q1",
            type: "select",
            options: [{ value: "a", meta: { scoring: { points: 1 } } }],
          },
        ],
      }),
    });
    expect(collectScoringIssues(orphan).map((issue) => issue.code)).toContain(
      "SCORING_OPTION_POINTS_NEED_VARIABLE",
    );
  });

  it("rejects unknown variables on option add and invalid mixed option meta", () => {
    const unknown = normalizeFormSnapshot({
      id: "unk",
      ...defineForm({
        title: "Unk",
        meta: { scoring: { variables: [{ id: "x" }] } },
        fields: [
          {
            id: "q1",
            type: "select",
            options: [
              {
                value: "a",
                meta: {
                  scoring: { add: [{ variable: "nope", points: 1 }] },
                },
              },
            ],
          },
        ],
      }),
    });
    const unknownIssues = collectScoringIssues(unknown);
    expect(unknownIssues.map((issue) => issue.code)).toContain(
      "SCORING_UNKNOWN_VARIABLE",
    );
    expect(
      unknownIssues.some((issue) => issue.params?.variable === "nope"),
    ).toBe(true);

    const both = normalizeFormSnapshot({
      id: "both",
      ...defineForm({
        title: "Both",
        meta: { scoring: { variables: [{ id: "x" }] } },
        fields: [
          {
            id: "q1",
            type: "select",
            options: [
              {
                value: "a",
                meta: {
                  scoring: {
                    points: 1,
                    add: [{ variable: "x", points: 1 }],
                  },
                },
              },
            ],
          },
        ],
      }),
    });
    expect(collectScoringIssues(both).map((issue) => issue.code)).toContain(
      "SCORING_INVALID_META",
    );
  });
});
