import { describe, expect, it } from "vitest";

import { normalizeFormSnapshot } from "@dimah-form/core";

import { buildCodebook, liveCodebook, mergeCodebooks } from "./codebook";
import { snapshotKey } from "./hash";
import { emptyCodebook } from "./spec";

const older = "2026-01-01T00:00:00.000Z";
const newer = "2026-06-01T00:00:00.000Z";

describe("buildCodebook", () => {
  it("keeps the newest label and records the earlier view in history", async () => {
    const first = normalizeFormSnapshot({
      id: "contact",
      title: "Contact",
      fields: [{ id: "name", type: "text", label: "Name" }],
    });
    const second = normalizeFormSnapshot({
      id: "contact",
      title: "Contact",
      fields: [{ id: "name", type: "text", label: "Full name" }],
    });
    const firstKey = await snapshotKey(first);
    const secondKey = await snapshotKey(second);
    const codebook = buildCodebook([
      { snapshotKey: firstKey, definition: first, seenAt: older },
      { snapshotKey: secondKey, definition: second, seenAt: newer },
    ]);
    expect(codebook.fields[0]?.label).toBe("Full name");
    expect(codebook.fields[0]?.history).toEqual([
      { snapshotKey: firstKey, type: "text", label: "Name" },
    ]);
    expect(codebook.snapshots.map((snapshot) => snapshot.key).sort()).toEqual(
      [firstKey, secondKey].sort(),
    );
  });

  it("records the earlier type in history when the same id changes type", async () => {
    const text = normalizeFormSnapshot({
      id: "contact",
      title: "Contact",
      fields: [{ id: "age", type: "text", label: "Age" }],
    });
    const number = normalizeFormSnapshot({
      id: "contact",
      title: "Contact",
      fields: [{ id: "age", type: "number", label: "Age" }],
    });
    const codebook = buildCodebook([
      {
        snapshotKey: await snapshotKey(text),
        definition: text,
        seenAt: older,
      },
      {
        snapshotKey: await snapshotKey(number),
        definition: number,
        seenAt: newer,
      },
    ]);
    expect(codebook.fields[0]?.type).toBe("number");
    expect(codebook.fields[0]?.history?.[0]?.type).toBe("text");
    expect(codebook.fields[0]?.history?.[0]?.label).toBe("Age");
  });

  it("sorts field ids instead of first-seen order", async () => {
    const definition = normalizeFormSnapshot({
      id: "survey",
      title: "Survey",
      fields: [
        { id: "z", type: "text" },
        { id: "a", type: "text" },
        { id: "m10", type: "text" },
        { id: "m2", type: "text" },
      ],
    });
    const codebook = buildCodebook([
      {
        snapshotKey: await snapshotKey(definition),
        definition,
        seenAt: newer,
      },
    ]);
    expect(codebook.fields.map((field) => field.id)).toEqual([
      "a",
      "m2",
      "m10",
      "z",
    ]);
  });

  it("documents scoring variables from snapshot meta", async () => {
    const definition = normalizeFormSnapshot({
      id: "quiz",
      title: "Quiz",
      meta: {
        scoring: {
          variables: [{ id: "gad7", label: "GAD-7", max: 21 }],
          bands: [{ variable: "gad7", from: 0, to: 4, label: "Minimal" }],
        },
      },
      fields: [{ id: "q1", type: "text" }],
    });
    const codebook = buildCodebook([
      {
        snapshotKey: await snapshotKey(definition),
        definition,
        seenAt: newer,
      },
    ]);
    expect(codebook.scores?.variables[0]).toMatchObject({
      id: "gad7",
      label: "GAD-7",
      max: 21,
    });
    expect(codebook.scores?.variables[0]?.missing).toBeUndefined();
    expect(codebook.scores?.bands?.[0]?.label).toBe("Minimal");
  });

  it("copies scoring maps, formulas, and an earlier points view", async () => {
    const olderDefinition = normalizeFormSnapshot({
      id: "quiz",
      title: "Quiz",
      meta: {
        scoring: {
          variables: [{ id: "gad7", max: 3, missing: "incomplete" }],
          bands: [{ variable: "gad7", from: 0, to: 3, label: "Low" }],
          formulas: [{ id: "total", op: "sum", vars: ["gad7"] }],
        },
      },
      fields: [
        {
          id: "q1",
          type: "select",
          label: "Old",
          meta: { scoring: { variable: "gad7" } },
          options: [
            { value: "0", label: "Zero", meta: { scoring: { points: 0 } } },
          ],
        },
      ],
    });
    const newerDefinition = normalizeFormSnapshot({
      id: "quiz",
      title: "Quiz",
      meta: {
        scoring: {
          variables: [{ id: "gad7", max: 21, missing: "zero" }],
          bands: [{ variable: "gad7", from: 0, to: 9, label: "Low" }],
          formulas: [
            { id: "total", label: "Total", op: "sum", vars: ["gad7"] },
          ],
        },
      },
      fields: [
        {
          id: "q1",
          type: "select",
          label: "New",
          meta: { scoring: { variable: "gad7", reverse: true } },
          options: [
            { value: "0", label: "Zero", meta: { scoring: { points: 1 } } },
          ],
        },
      ],
    });
    const olderKey = await snapshotKey(olderDefinition);
    const newerKey = await snapshotKey(newerDefinition);
    const codebook = buildCodebook([
      {
        snapshotKey: olderKey,
        definition: olderDefinition,
        seenAt: older,
      },
      {
        snapshotKey: newerKey,
        definition: newerDefinition,
        seenAt: newer,
      },
    ]);
    expect(codebook.fields[0]).toMatchObject({
      label: "New",
      scoring: { variable: "gad7", reverse: true },
      options: [{ value: "0", label: "Zero", points: 1 }],
    });
    expect(codebook.fields[0]?.history).toEqual([
      {
        snapshotKey: olderKey,
        type: "select",
        label: "Old",
        scoring: { variable: "gad7" },
        options: [{ value: "0", label: "Zero", points: 0 }],
      },
    ]);
    expect(codebook.scores?.variables[0]).toMatchObject({
      max: 21,
      missing: "zero",
    });
    expect(codebook.scores?.variables[0]?.history).toEqual([
      { snapshotKey: olderKey, max: 3, missing: "incomplete" },
    ]);
    expect(codebook.scores?.bands?.[0]).toMatchObject({ to: 9 });
    expect(codebook.scores?.bands?.[0]?.history).toEqual([
      { snapshotKey: olderKey, from: 0, to: 3 },
    ]);
    expect(codebook.scores?.formulas?.[0]).toMatchObject({
      id: "total",
      label: "Total",
      op: "sum",
      vars: ["gad7"],
    });
    expect(codebook.scores?.formulas?.[0]?.history).toEqual([
      { snapshotKey: olderKey, op: "sum", vars: ["gad7"] },
    ]);
  });

  it("records required, showWhen, and number constraints", async () => {
    const definition = normalizeFormSnapshot({
      id: "intake",
      title: "Intake",
      fields: [
        {
          id: "age",
          type: "number",
          required: true,
          description: "Years",
          min: 0,
          max: 120,
          integer: true,
          showWhen: { field: "ok", equals: true },
        },
        { id: "ok", type: "boolean" },
      ],
    });
    const codebook = buildCodebook([
      {
        snapshotKey: await snapshotKey(definition),
        definition,
        seenAt: newer,
      },
    ]);
    expect(codebook.fields.find((field) => field.id === "age")).toMatchObject({
      required: true,
      description: "Years",
      constraints: { min: 0, max: 120, integer: true },
      showWhen: { field: "ok", equals: true },
    });
  });
});

describe("mergeCodebooks", () => {
  it("is order-independent for lastSeenAt labels", async () => {
    const first = normalizeFormSnapshot({
      id: "contact",
      title: "Contact",
      fields: [{ id: "name", type: "text", label: "Name" }],
    });
    const second = normalizeFormSnapshot({
      id: "contact",
      title: "Contact",
      fields: [{ id: "name", type: "text", label: "Full name" }],
    });
    const a = buildCodebook([
      {
        snapshotKey: await snapshotKey(first),
        definition: first,
        seenAt: older,
      },
    ]);
    const b = buildCodebook([
      {
        snapshotKey: await snapshotKey(second),
        definition: second,
        seenAt: newer,
      },
    ]);
    expect(mergeCodebooks(a, b).fields[0]?.label).toBe("Full name");
    expect(mergeCodebooks(b, a).fields[0]?.label).toBe("Full name");
    expect(mergeCodebooks(emptyCodebook(), b).fields[0]?.label).toBe(
      "Full name",
    );
  });

  it("keeps an older constraint view when page codebooks are merged", async () => {
    const first = normalizeFormSnapshot({
      id: "intake",
      title: "Intake",
      fields: [
        {
          id: "age",
          type: "number",
          label: "Age",
          min: 0,
          max: 99,
          integer: true,
        },
      ],
    });
    const second = normalizeFormSnapshot({
      id: "intake",
      title: "Intake",
      fields: [
        {
          id: "age",
          type: "number",
          label: "Age",
          min: 18,
          max: 120,
          integer: true,
        },
      ],
    });
    const olderPage = buildCodebook([
      {
        snapshotKey: await snapshotKey(first),
        definition: first,
        seenAt: older,
      },
    ]);
    const newerPage = buildCodebook([
      {
        snapshotKey: await snapshotKey(second),
        definition: second,
        seenAt: newer,
      },
    ]);
    const merged = mergeCodebooks(olderPage, newerPage);
    expect(merged.fields[0]?.constraints).toEqual({
      min: 18,
      max: 120,
      integer: true,
    });
    expect(merged.fields[0]?.history?.[0]?.constraints).toEqual({
      min: 0,
      max: 99,
      integer: true,
    });
    expect(merged.fields[0]?.history?.[0]?.snapshotKey).toBe(
      await snapshotKey(first),
    );
  });
});

describe("liveCodebook", () => {
  it("keeps live field order and is not a historical merge", async () => {
    const definition = normalizeFormSnapshot({
      id: "survey",
      title: "Survey",
      fields: [
        { id: "z", type: "text", label: "Z" },
        { id: "a", type: "text", label: "A" },
      ],
    });
    const live = await liveCodebook(definition);
    expect(live.fields.map((field) => field.id)).toEqual(["z", "a"]);
    expect(live.snapshots).toEqual([
      { key: await snapshotKey(definition), n: 0 },
    ]);
    expect(live.fields[0]?.history).toBeUndefined();
  });
});
