import { describe, expect, it } from "vitest";

import { normalizeFormSnapshot } from "@dimah-form/core";

import { buildCodebook } from "./codebook";
import {
  createCsvEncoder,
  toCsv,
  toCsvLabels,
  toDataPackage,
  toJsonl,
} from "./encode";
import { snapshotKey } from "./hash";
import { projectResponse } from "./project";
import { DATASET_SPEC, type DatasetRecord } from "./spec";

async function sample() {
  const definition = normalizeFormSnapshot({
    id: "contact",
    title: "Contact",
    fields: [
      { id: "name", type: "text", label: "Name" },
      {
        id: "tags",
        type: "multiSelect",
        options: [
          { value: "a", label: "Alpha" },
          { value: "b", label: "Beta" },
        ],
      },
    ],
  });
  const record: DatasetRecord = await projectResponse({
    id: "r1",
    formId: "contact",
    status: "submitted",
    definition,
    answers: { name: 'Ada "Lovelace"', tags: ["a", "b"] },
    respondentId: "user-1",
    submittedAt: "2026-01-02T00:00:00.000Z",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-02T00:00:00.000Z",
  });
  const codebook = buildCodebook([
    {
      snapshotKey: await snapshotKey(definition),
      definition,
      seenAt: record.submittedAt,
    },
  ]);
  return { record, codebook, definition };
}

describe("toJsonl", () => {
  it("writes one JSON object per line and strips respondentId by default", async () => {
    const { record } = await sample();
    const jsonl = toJsonl([record]);
    const lines = jsonl.trimEnd().split("\n");
    expect(lines).toHaveLength(1);
    const parsed = JSON.parse(lines[0]) as DatasetRecord;
    expect(parsed.spec).toBe(DATASET_SPEC);
    expect(parsed.respondentId).toBeUndefined();
    expect(parsed.id).toBe("r1");
  });
});

describe("toCsv", () => {
  it("quotes commas, quotes, and newlines (RFC 4180)", async () => {
    const definition = normalizeFormSnapshot({
      id: "contact",
      title: "Contact",
      fields: [{ id: "note", type: "text" }],
    });
    const record = await projectResponse({
      id: "r1",
      formId: "contact",
      status: "submitted",
      definition,
      answers: { note: 'say "hi",\nplease' },
      respondentId: null,
      submittedAt: null,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    });
    const codebook = buildCodebook([
      {
        snapshotKey: record.snapshotKey,
        definition,
        seenAt: record.createdAt,
      },
    ]);
    const csv = toCsv([record], codebook);
    expect(csv).toContain('"say ""hi"",\nplease"');
    expect(csv.endsWith("\r\n")).toBe(true);
  });

  it("joins multiSelect codes with semicolons", async () => {
    const { record, codebook } = await sample();
    const csv = toCsv([record], codebook);
    expect(csv).toContain("a;b");
    expect(csv.split("\r\n")[0]).toBe(
      "id,formId,status,submittedAt,createdAt,updatedAt,snapshotKey,name,tags",
    );
  });

  it("stringifies object values in the codes CSV", async () => {
    const definition = normalizeFormSnapshot({
      id: "files",
      title: "Files",
      fields: [{ id: "file", type: "file" }],
    });
    const record = await projectResponse({
      id: "r1",
      formId: "files",
      status: "submitted",
      definition,
      answers: { file: { id: "abc", name: "a.png" } },
      respondentId: null,
      submittedAt: "2026-01-01T00:00:00.000Z",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    });
    const codebook = buildCodebook([
      {
        snapshotKey: record.snapshotKey,
        definition,
        seenAt: record.createdAt,
      },
    ]);
    expect(toCsv([record], codebook)).toContain(
      '"{""id"":""abc"",""name"":""a.png""}"',
    );
  });
});

describe("toCsvLabels", () => {
  it("adds a UTF-8 BOM and joins multiSelect labels with semicolons", async () => {
    const { record, codebook } = await sample();
    const csv = toCsvLabels([record], codebook);
    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv).toContain("Alpha;Beta");
    expect(toCsv([record], codebook).startsWith("\uFEFF")).toBe(false);
  });

  it("allowlists fields, omits identity columns, and remaps boolean labels", async () => {
    const definition = normalizeFormSnapshot({
      id: "quiz",
      title: "Quiz",
      fields: [
        { id: "name", type: "text" },
        { id: "ok", type: "boolean" },
      ],
    });
    const record = await projectResponse({
      id: "r1",
      formId: "quiz",
      status: "submitted",
      definition,
      answers: { name: "Ada", ok: true },
      respondentId: null,
      submittedAt: "2026-01-01T00:00:00.000Z",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    });
    const codebook = buildCodebook([
      {
        snapshotKey: record.snapshotKey,
        definition,
        seenAt: record.createdAt,
      },
    ]);
    const csv = toCsvLabels([record], codebook, {
      fields: ["ok"],
      omit: ["snapshotKey"],
      booleanLabels: { true: "بله", false: "خیر" },
    });
    const header = csv.replace(/^\uFEFF/, "").split("\r\n")[0];
    expect(header).toBe("id,formId,status,submittedAt,createdAt,updatedAt,ok");
    expect(csv).toContain("بله");
    expect(csv).not.toContain("Ada");
  });
});

describe("createCsvEncoder", () => {
  it("streams the same codes CSV as toCsv", async () => {
    const { record, codebook } = await sample();
    const encoder = createCsvEncoder(codebook);
    expect(encoder.header() + encoder.row(record)).toBe(
      toCsv([record], codebook),
    );
    expect(encoder.header("labels") + encoder.row(record, "labels")).toBe(
      toCsvLabels([record], codebook),
    );
  });
});

describe("toDataPackage", () => {
  it("returns the frictionless-style file map", async () => {
    const { record, codebook } = await sample();
    const files = toDataPackage([record], codebook);
    expect(Object.keys(files)).toEqual([
      "datapackage.json",
      "codebook.json",
      "responses.jsonl",
      "responses.csv",
      "responses.labels.csv",
    ]);
    const manifest = JSON.parse(files["datapackage.json"]) as {
      resources: { path: string }[];
    };
    expect(manifest.resources.map((resource) => resource.path)).toEqual([
      "responses.jsonl",
      "responses.csv",
      "responses.labels.csv",
      "codebook.json",
    ]);
  });
});
