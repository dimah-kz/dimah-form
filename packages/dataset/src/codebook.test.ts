import { describe, expect, it } from "vitest";

import { normalizeFormSnapshot } from "@dimah-form/core";

import { buildCodebook, liveCodebook, mergeCodebooks } from "./codebook";
import { snapshotKey } from "./hash";
import { emptyCodebook } from "./spec";

const older = "2026-01-01T00:00:00.000Z";
const newer = "2026-06-01T00:00:00.000Z";

describe("buildCodebook", () => {
  it("records labelConflicts and keeps the newest label", async () => {
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
    expect(codebook.fields[0]?.labelConflicts).toEqual([
      { snapshotKey: firstKey, label: "Name" },
    ]);
    expect(codebook.snapshots.map((snapshot) => snapshot.key).sort()).toEqual(
      [firstKey, secondKey].sort(),
    );
  });

  it("records typeConflicts when the same id changes type", async () => {
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
    expect(codebook.fields[0]?.typeConflicts?.[0]?.type).toBe("text");
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
    expect(codebook.scores?.bands?.[0]?.label).toBe("Minimal");
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
    expect(live.snapshots).toHaveLength(1);
    expect(live.fields[0]?.labelConflicts).toBeUndefined();
  });
});
