import {
  createFormClient,
  defineForm,
  isFormErrorCode,
} from "@dimah-form/core";
import { dimahForm, memoryAdapter } from "@dimah-form/server";
import { describe, expect, expectTypeOf, it } from "vitest";

import { insightsClientPlugin } from "./client";
import { insightsPlugin } from "./plugin";

const quiz = defineForm({
  title: "Quiz",
  meta: {
    scoring: {
      variables: [{ id: "gad7", max: 3 }],
      bands: [{ variable: "gad7", from: 0, to: 3, label: "Low" }],
    },
  },
  fields: [
    {
      id: "q1",
      type: "select",
      required: true,
      options: [
        { value: "0", meta: { scoring: { points: 0 } } },
        { value: "1", meta: { scoring: { points: 1 } } },
        { value: "2", meta: { scoring: { points: 2 } } },
        { value: "3", meta: { scoring: { points: 3 } } },
      ],
      meta: { scoring: { variable: "gad7" } },
    },
  ],
});

const plain = defineForm({
  title: "Plain",
  fields: [
    { id: "name", type: "text", required: true },
    {
      id: "city",
      type: "select",
      options: [
        { value: "tehran", label: "Tehran" },
        { value: "isfahan", label: "Isfahan" },
      ],
    },
    { id: "remote", type: "boolean" },
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

describe("insightsPlugin", () => {
  it("summarizes submitted categorical answers from snapshots", async () => {
    const form = dimahForm({
      database: memoryAdapter(),
      plugins: [insightsPlugin()],
      forms: { plain },
    });
    await submitPlain(form, {
      name: "Ada",
      city: "tehran",
      remote: true,
    });
    await submitPlain(form, {
      name: "Bob",
      city: "tehran",
      remote: false,
    });
    await form.api.startResponse({ body: { formId: "plain" } });
    const summary = await form.api.getFormInsights({
      query: { formId: "plain" },
    });
    expect(summary.total).toBe(3);
    expect(summary.scanned).toBe(3);
    expect(summary.truncated).toBe(false);
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
    expect(summary.fields.find((field) => field.id === "city")?.values).toEqual(
      [{ value: "tehran", label: "Tehran", n: 2, pct: 1 }],
    );
  });

  it("applies the same status filter as listResponses", async () => {
    const form = dimahForm({
      database: memoryAdapter(),
      plugins: [insightsPlugin()],
      forms: { plain },
    });
    await submitPlain(form, { name: "Ada", city: "tehran" });
    await form.api.startResponse({ body: { formId: "plain" } });
    const summary = await form.api.getFormInsights({
      query: { formId: "plain", status: "submitted" },
    });
    expect(summary.total).toBe(1);
    expect(summary.byStatus).toEqual({
      draft: 0,
      submitted: 1,
      abandoned: 0,
    });
  });

  it("segments by whereField / whereValue", async () => {
    const form = dimahForm({
      database: memoryAdapter(),
      plugins: [insightsPlugin()],
      forms: { plain },
    });
    await submitPlain(form, { name: "Ada", city: "tehran", remote: true });
    await submitPlain(form, { name: "Bob", city: "isfahan", remote: false });
    const summary = await form.api.getFormInsights({
      query: {
        formId: "plain",
        status: "submitted",
        whereField: "city",
        whereValue: "tehran",
      },
    });
    expect(summary.total).toBe(1);
    expect(summary.scanned).toBe(2);
    expect(
      summary.fields.find((field) => field.id === "remote")?.values,
    ).toEqual([{ value: "true", label: "Yes", n: 1, pct: 1 }]);
  });

  it("returns a UTC day series when bucket=day", async () => {
    const form = dimahForm({
      database: memoryAdapter(),
      plugins: [insightsPlugin()],
      forms: { plain },
    });
    await submitPlain(form, { name: "Ada", city: "tehran" });
    const summary = await form.api.getFormInsights({
      query: { formId: "plain", status: "submitted", bucket: "day" },
    });
    expect(summary.series?.bucket).toBe("day");
    expect(summary.series?.points.length).toBe(1);
    expect(summary.series?.points[0]?.n).toBe(1);
  });

  it("caps the walk at plugin maxRows", async () => {
    const form = dimahForm({
      database: memoryAdapter(),
      plugins: [insightsPlugin({ maxRows: 1 })],
      forms: { plain },
    });
    await submitPlain(form, { name: "Ada", city: "tehran" });
    await submitPlain(form, { name: "Bob", city: "isfahan" });
    const summary = await form.api.getFormInsights({
      query: { formId: "plain", status: "submitted" },
    });
    expect(summary.scanned).toBe(1);
    expect(summary.truncated).toBe(true);
    expect(summary.total).toBe(1);
  });

  it("attaches score bands when scoring is installed", async () => {
    const form = dimahForm({
      database: memoryAdapter(),
      plugins: [insightsPlugin()],
      forms: { quiz },
    });
    const started = await form.api.startResponse({ body: { formId: "quiz" } });
    await form.api.submitResponse({
      body: { responseId: started.id, answers: { q1: "2" } },
    });
    const summary = await form.api.getFormInsights({
      query: { formId: "quiz" },
    });
    expect(summary.scores?.variables[0]).toMatchObject({
      id: "gad7",
      n: 1,
      complete: 1,
      mean: 2,
      stdev: 0,
    });
    expect(summary.scores?.variables[0]?.bands).toEqual([
      { label: "Low", n: 1, pct: 1 },
    ]);
  });

  it("builds a crosstab of two categorical fields", async () => {
    const form = dimahForm({
      database: memoryAdapter(),
      plugins: [insightsPlugin()],
      forms: { plain },
    });
    await submitPlain(form, { name: "Ada", city: "tehran", remote: true });
    await submitPlain(form, { name: "Bob", city: "tehran", remote: false });
    await submitPlain(form, { name: "Cyd", city: "isfahan", remote: true });
    const table = await form.api.getFormCrosstab({
      query: {
        formId: "plain",
        status: "submitted",
        row: "city",
        col: "remote",
      },
    });
    expect(table.row.id).toBe("city");
    expect(table.col.id).toBe("remote");
    expect(table.cells).toEqual(
      expect.arrayContaining([
        { row: "tehran", col: "true", n: 1 },
        { row: "tehran", col: "false", n: 1 },
        { row: "isfahan", col: "true", n: 1 },
      ]),
    );
    expect(table.rowTotals).toEqual(
      expect.arrayContaining([
        { value: "tehran", label: "Tehran", n: 2 },
        { value: "isfahan", label: "Isfahan", n: 1 },
      ]),
    );
  });

  it("rejects a non-categorical crosstab field", async () => {
    const form = dimahForm({
      database: memoryAdapter(),
      plugins: [insightsPlugin()],
      forms: { plain },
    });
    await expect(
      form.api.getFormCrosstab({
        query: { formId: "plain", row: "name", col: "city" },
      }),
    ).rejects.toSatisfy((error: unknown) =>
      isFormErrorCode(error, "VALIDATION_ERROR"),
    );
  });

  it("throws UNKNOWN_FORM for a missing formId", async () => {
    const form = dimahForm({
      database: memoryAdapter(),
      plugins: [insightsPlugin()],
      forms: { plain },
    });
    await expect(
      form.api.getFormInsights({ query: { formId: "missing" } }),
    ).rejects.toSatisfy((error: unknown) =>
      isFormErrorCode(error, "UNKNOWN_FORM"),
    );
  });

  it("uses getFormInsights and getFormCrosstab as guard operations", async () => {
    const operations: string[] = [];
    const form = dimahForm({
      database: memoryAdapter(),
      plugins: [insightsPlugin()],
      forms: { plain },
      guard: ({ operation }) => {
        operations.push(operation);
      },
    });
    await form.api.getFormInsights({ query: { formId: "plain" } });
    await form.api.getFormCrosstab({
      query: { formId: "plain", row: "city", col: "remote" },
    });
    expect(operations).toContain("getFormInsights");
    expect(operations).toContain("getFormCrosstab");
  });
});

describe("insightsClientPlugin", () => {
  it("calls GET /insights/summary and GET /insights/crosstab", async () => {
    const plugin = insightsClientPlugin();
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
            formId: "plain",
            total: 0,
            byStatus: { draft: 0, submitted: 0, abandoned: 0 },
            completion: { submitted: 0, complete: 0, rate: null },
            fields: [],
            scanned: 0,
            truncated: false,
            row: { id: "city", label: "city" },
            col: { id: "remote", label: "remote" },
            cells: [],
            rowTotals: [],
            colTotals: [],
          }),
          { headers: { "content-type": "application/json" } },
        );
      },
    });
    await client.getFormInsights({ formId: "plain" });
    expect(calls[0]).toContain("/insights/summary");
    await client.getFormCrosstab({
      formId: "plain",
      row: "city",
      col: "remote",
    });
    expect(calls[1]).toContain("/insights/crosstab");
    expectTypeOf(client.getFormInsights).toBeFunction();
    expectTypeOf(client.getFormCrosstab).toBeFunction();
  });

  it("does not import @dimah-form/server from isomorphic modules", async () => {
    const { readFile } = await import("node:fs/promises");
    const { dirname, join } = await import("node:path");
    const { fileURLToPath } = await import("node:url");
    const dir = dirname(fileURLToPath(import.meta.url));
    const files = [
      "client.ts",
      "spec.ts",
      "summary.ts",
      "scoring.ts",
      "errors.ts",
      "routes.ts",
      "categorical.ts",
      "numeric.ts",
      "where.ts",
      "crosstab.ts",
    ];
    for (const file of files) {
      const source = await readFile(join(dir, file), "utf8");
      expect(source).not.toContain("@dimah-form/server");
      expect(source).not.toContain("@dimah-form/react");
      expect(source).not.toContain("@dimah-form/ui");
    }
  });
});
