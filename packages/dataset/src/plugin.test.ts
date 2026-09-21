import {
  createFormClient,
  defineFieldType,
  defineForm,
  isFormErrorCode,
} from "@dimah-form/core";
import { dimahForm, memoryAdapter } from "@dimah-form/server";
import { describe, expect, expectTypeOf, it } from "vitest";

import { datasetClientPlugin } from "./client";
import { datasetPlugin } from "./plugin";
import { DATASET_SPEC } from "./spec";

const likert = [
  { value: "0", meta: { scoring: { points: 0 } } },
  { value: "1", meta: { scoring: { points: 1 } } },
  { value: "2", meta: { scoring: { points: 2 } } },
  { value: "3", meta: { scoring: { points: 3 } } },
];

const quiz = defineForm({
  title: "Quiz",
  meta: {
    scoring: {
      variables: [{ id: "gad7", max: 3 }],
    },
  },
  fields: [
    {
      id: "q1",
      type: "select",
      required: true,
      options: likert,
      meta: { scoring: { variable: "gad7" } },
    },
  ],
});

const plain = defineForm({
  title: "Plain",
  fields: [
    { id: "name", type: "text", required: true },
    { id: "city", type: "text" },
  ],
});

async function submitPlain(
  form: ReturnType<typeof dimahForm>,
  answers: Record<string, unknown>,
) {
  const started = await form.api.startResponse({ body: { formId: "plain" } });
  return form.api.submitResponse({
    body: { responseId: started.id, answers },
  });
}

describe("datasetPlugin", () => {
  it("pages submitted responses with a page codebook and nextOffset", async () => {
    const form = dimahForm({
      database: memoryAdapter(),
      plugins: [datasetPlugin()],
      forms: { plain },
    });
    await submitPlain(form, { name: "Ada" });
    await submitPlain(form, { name: "Bob" });
    await submitPlain(form, { name: "Cyd" });
    const first = await form.api.getDatasetPage({
      query: { formId: "plain", limit: 2 },
    });
    expect(first.spec).toBe(DATASET_SPEC);
    expect(first.records).toHaveLength(2);
    expect(first.limit).toBe(2);
    expect(first.offset).toBe(0);
    expect(first.nextOffset).toBe(2);
    expect(first.codebook.fields.map((field) => field.id)).toEqual([
      "city",
      "name",
    ]);
    const second = await form.api.getDatasetPage({
      query: { formId: "plain", limit: 2, offset: first.nextOffset ?? 0 },
    });
    expect(second.records).toHaveLength(1);
    expect(second.nextOffset).toBeNull();
  });

  it("defaults to submitted and skips drafts", async () => {
    const form = dimahForm({
      database: memoryAdapter(),
      plugins: [datasetPlugin()],
      forms: { plain },
    });
    await form.api.startResponse({ body: { formId: "plain" } });
    await submitPlain(form, { name: "Ada" });
    const page = await form.api.getDatasetPage({
      query: { formId: "plain" },
    });
    expect(page.records).toHaveLength(1);
    expect(page.records[0]?.status).toBe("submitted");
    const drafts = await form.api.getDatasetPage({
      query: { formId: "plain", status: "draft" },
    });
    expect(drafts.records).toHaveLength(1);
    expect(drafts.records[0]?.status).toBe("draft");
  });

  it("projects the stored snapshot after the live form changes", async () => {
    const form = dimahForm({
      database: memoryAdapter(),
      plugins: [datasetPlugin()],
    });
    await form.api.saveForm({
      body: {
        id: "live",
        title: "Live",
        fields: [{ id: "name", type: "text", required: true, label: "Name" }],
      },
    });
    const started = await form.api.startResponse({ body: { formId: "live" } });
    await form.api.submitResponse({
      body: { responseId: started.id, answers: { name: "Ada" } },
    });
    await form.api.saveForm({
      body: {
        id: "live",
        title: "Live",
        fields: [
          { id: "name", type: "text", required: true, label: "Full name" },
          { id: "email", type: "email", label: "Email" },
        ],
      },
    });
    const page = await form.api.getDatasetPage({
      query: { formId: "live" },
    });
    expect(page.records[0]?.fields.map((field) => field.id)).toEqual(["name"]);
    expect(page.codebook.fields.map((field) => field.id)).toEqual(["name"]);
    expect(page.codebook.fields[0]?.label).toBe("Name");
    const live = await form.api.getLiveCodebook({
      query: { formId: "live" },
    });
    expect(live.fields.map((field) => field.id)).toEqual(["name", "email"]);
    expect(live.fields[0]?.label).toBe("Full name");
  });

  it("attaches scores without writing them into answers", async () => {
    const form = dimahForm({
      database: memoryAdapter(),
      plugins: [datasetPlugin()],
      forms: { quiz },
    });
    const started = await form.api.startResponse({ body: { formId: "quiz" } });
    const submitted = await form.api.submitResponse({
      body: { responseId: started.id, answers: { q1: "2" } },
    });
    expect(submitted.answers).toEqual({ q1: "2" });
    const page = await form.api.getDatasetPage({
      query: { formId: "quiz" },
    });
    expect(page.records[0]?.scores?.variables.gad7.raw).toBe(2);
    const stored = await form.api.getResponse({
      query: { responseId: started.id },
    });
    expect(stored.answers).toEqual({ q1: "2" });
    expect(stored.answers).not.toHaveProperty("gad7");
  });

  it("includes respondentId on HTTP records", async () => {
    const form = dimahForm({
      database: memoryAdapter(),
      plugins: [datasetPlugin()],
      forms: { plain },
    });
    const started = await form.api.startResponse({
      body: { formId: "plain", respondentId: "user-1" },
    });
    await form.api.submitResponse({
      body: { responseId: started.id, answers: { name: "Ada" } },
    });
    const page = await form.api.getDatasetPage({
      query: { formId: "plain" },
    });
    expect(page.records[0]?.respondentId).toBe("user-1");
  });

  it("throws UNKNOWN_FORM for a missing formId", async () => {
    const form = dimahForm({
      database: memoryAdapter(),
      plugins: [datasetPlugin()],
      forms: { plain },
    });
    await expect(
      form.api.getDatasetPage({ query: { formId: "missing" } }),
    ).rejects.toSatisfy((error: unknown) =>
      isFormErrorCode(error, "UNKNOWN_FORM"),
    );
    await expect(
      form.api.getLiveCodebook({ query: { formId: "missing" } }),
    ).rejects.toSatisfy((error: unknown) =>
      isFormErrorCode(error, "UNKNOWN_FORM"),
    );
  });

  it("uses getDatasetPage and getLiveCodebook as guard operations", async () => {
    const operations: string[] = [];
    const form = dimahForm({
      database: memoryAdapter(),
      plugins: [datasetPlugin()],
      forms: { plain },
      guard: ({ operation }) => {
        operations.push(operation);
      },
    });
    await form.api.getDatasetPage({ query: { formId: "plain" } });
    await form.api.getLiveCodebook({ query: { formId: "plain" } });
    expect(operations).toContain("getDatasetPage");
    expect(operations).toContain("getLiveCodebook");
  });

  it("serves GET /dataset/responses over HTTP", async () => {
    const form = dimahForm({
      database: memoryAdapter(),
      plugins: [datasetPlugin()],
      forms: { plain },
    });
    await submitPlain(form, { name: "Ada" });
    const http = await form.handler(
      new Request("http://localhost/api/form/dataset/responses?formId=plain"),
    );
    expect(http.ok).toBe(true);
    const body = (await http.json()) as { spec: string; records: unknown[] };
    expect(body.spec).toBe(DATASET_SPEC);
    expect(body.records).toHaveLength(1);
  });

  it("formats custom field types from the instance registry", async () => {
    const rating = defineFieldType({
      type: "rating",
      validate: () => undefined,
      format: (value) => (typeof value === "number" ? `${value} stars` : ""),
      $Infer: 0 as number,
    });
    const form = dimahForm({
      database: memoryAdapter(),
      fieldTypes: [rating],
      plugins: [datasetPlugin()],
      forms: {
        rate: defineForm({
          title: "Rate",
          fields: [{ id: "n", type: "rating", required: true }],
        }),
      },
    });
    const started = await form.api.startResponse({ body: { formId: "rate" } });
    await form.api.submitResponse({
      body: { responseId: started.id, answers: { n: 4 } },
    });
    const page = await form.api.getDatasetPage({
      query: { formId: "rate" },
    });
    expect(page.records[0]?.fields[0]).toMatchObject({
      value: 4,
      formatted: "4 stars",
    });
  });

  it("emits a dense null for unanswered snapshot fields", async () => {
    const form = dimahForm({
      database: memoryAdapter(),
      plugins: [datasetPlugin()],
      forms: { plain },
    });
    await submitPlain(form, { name: "Ada" });
    const page = await form.api.getDatasetPage({
      query: { formId: "plain" },
    });
    expect(page.records[0]?.fields).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "name", value: "Ada" }),
        expect.objectContaining({ id: "city", value: null, formatted: "" }),
      ]),
    );
  });
});

describe("datasetClientPlugin", () => {
  it("exposes getDatasetPage and getLiveCodebook", async () => {
    const plugin = datasetClientPlugin();
    const calls: string[] = [];
    const client = createFormClient({
      plugins: [plugin],
      fetch: async (input) => {
        const url =
          typeof input === "string"
            ? input
            : input instanceof URL
              ? input.href
              : input.url;
        calls.push(url);
        return new Response(
          JSON.stringify({
            spec: DATASET_SPEC,
            records: [],
            codebook: { spec: DATASET_SPEC, snapshots: [], fields: [] },
            limit: 50,
            offset: 0,
            nextOffset: null,
          }),
          { headers: { "content-type": "application/json" } },
        );
      },
    });
    await client.getDatasetPage({ formId: "plain" });
    expect(calls[0]).toContain("/dataset/responses");
    expect(calls[0]).toContain("formId=plain");
    expectTypeOf(client.getDatasetPage).toBeFunction();
    expectTypeOf(client.getLiveCodebook).toBeFunction();
  });

  it("does not import @dimah-form/server from isomorphic modules", async () => {
    const { readFile } = await import("node:fs/promises");
    const { dirname, join } = await import("node:path");
    const { fileURLToPath } = await import("node:url");
    const dir = dirname(fileURLToPath(import.meta.url));
    const files = [
      "client.ts",
      "spec.ts",
      "hash.ts",
      "project.ts",
      "codebook.ts",
      "encode.ts",
      "reader.ts",
      "errors.ts",
      "routes.ts",
    ];
    for (const file of files) {
      const source = await readFile(join(dir, file), "utf8");
      expect(source).not.toContain("@dimah-form/server");
      expect(source).not.toContain("@dimah-form/react");
      expect(source).not.toContain("@dimah-form/ui");
    }
  });
});
