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

describe("toCsv scores and reserved field ids", () => {
  it("writes score missing beside raw, band, and complete", async () => {
    const definition = normalizeFormSnapshot({
      id: "quiz",
      title: "Quiz",
      fields: [{ id: "q1", type: "text" }],
    });
    const record = await projectResponse(
      {
        id: "r1",
        formId: "quiz",
        status: "submitted",
        definition,
        answers: { q1: "2" },
        respondentId: null,
        submittedAt: "2026-01-01T00:00:00.000Z",
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
      {
        scores: {
          complete: false,
          variables: {
            gad7: { raw: 2, missing: 1, complete: false, band: "Mild" },
          },
        },
      },
    );
    const codebook = buildCodebook([
      {
        snapshotKey: record.snapshotKey,
        definition,
        seenAt: record.createdAt,
      },
    ]);
    codebook.scores = {
      variables: [{ id: "gad7", inSnapshots: [record.snapshotKey] }],
    };
    const csv = toCsv([record], codebook);
    expect(csv.split("\r\n")[0]).toContain(
      "score.gad7.raw,score.gad7.band,score.gad7.complete,score.gad7.missing",
    );
    expect(csv).toContain("2,Mild,false,1");
  });

  it("prefixes a field id that collides with an identity column", async () => {
    const definition = normalizeFormSnapshot({
      id: "contact",
      title: "Contact",
      fields: [
        { id: "name", type: "text" },
        { id: "status", type: "text" },
      ],
    });
    const record = await projectResponse({
      id: "r1",
      formId: "contact",
      status: "submitted",
      definition,
      answers: { name: "Ada", status: "active" },
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
    const csv = toCsv([record], codebook);
    const [header, row] = csv.trimEnd().split("\r\n");
    expect(header).toBe(
      "id,formId,status,submittedAt,createdAt,updatedAt,snapshotKey,name,field.status",
    );
    expect(row).toContain("submitted");
    expect(row).toContain("Ada");
    expect(row?.endsWith(",active")).toBe(true);
    const allowed = toCsv([record], codebook, { fields: ["status"] });
    const allowedHeader = allowed.split("\r\n")[0];
    expect(allowedHeader).toContain("field.status");
    expect(allowedHeader).not.toContain(",name");
  });

  it("throws when a reserved field id and field.<id> would share a column", async () => {
    const definition = normalizeFormSnapshot({
      id: "contact",
      title: "Contact",
      fields: [
        { id: "status", type: "text" },
        { id: "field.status", type: "text" },
      ],
    });
    const record = await projectResponse({
      id: "r1",
      formId: "contact",
      status: "submitted",
      definition,
      answers: { status: "a", "field.status": "b" },
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
    expect(() => toCsv([record], codebook)).toThrow(
      'Dataset CSV column "field.status" is ambiguous',
    );
  });
});

describe("toDataPackage", () => {
  it("returns a data package with the table schema on the codes CSV", async () => {
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
      profile: string;
      resources: {
        path: string;
        schema?: { missingValues?: string[] };
      }[];
    };
    expect(manifest.profile).toBe("data-package");
    expect(manifest.resources.map((resource) => resource.path)).toEqual([
      "responses.jsonl",
      "responses.csv",
      "responses.labels.csv",
      "codebook.json",
    ]);
    const csv = manifest.resources.find(
      (resource) => resource.path === "responses.csv",
    );
    const jsonl = manifest.resources.find(
      (resource) => resource.path === "responses.jsonl",
    );
    expect(csv?.schema?.missingValues).toEqual([""]);
    expect(jsonl?.schema).toBeUndefined();
  });
});
