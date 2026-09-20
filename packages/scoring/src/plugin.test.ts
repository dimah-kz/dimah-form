import {
  createDefineForm,
  createFormClient,
  defineForm,
  isFormErrorCode,
} from "@dimah-form/core";
import { dimahForm, memoryAdapter } from "@dimah-form/server";
import { describe, expect, expectTypeOf, it } from "vitest";

import { scoringClientPlugin } from "./client";
import { scoringPlugin } from "./plugin";
import type { ScoreResult } from "./score";

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
  fields: [{ id: "name", type: "text", required: true }],
});

describe("scoringPlugin", () => {
  it("skips namespaced metaSchema when meta.scoring is absent", () => {
    expect(() =>
      dimahForm({
        database: memoryAdapter(),
        plugins: [scoringPlugin()],
        forms: { plain },
      }),
    ).not.toThrow();
  });

  it("rejects invalid meta.scoring at init", () => {
    expect(() =>
      dimahForm({
        database: memoryAdapter(),
        plugins: [scoringPlugin()],
        forms: {
          quiz: defineForm({
            title: "Quiz",
            meta: { scoring: { variables: [] } },
            fields: [{ id: "n", type: "text" }],
          }),
        },
      }),
    ).toThrow(/Invalid form "quiz"/);
  });

  it("rejects a field mapped to an unknown variable at init", () => {
    expect(() =>
      dimahForm({
        database: memoryAdapter(),
        plugins: [scoringPlugin()],
        forms: {
          quiz: defineForm({
            title: "Quiz",
            meta: { scoring: { variables: [{ id: "gad7" }] } },
            fields: [
              {
                id: "q1",
                type: "select",
                options: [{ value: "0", meta: { scoring: { points: 0 } } }],
                meta: { scoring: { variable: "nope" } },
              },
            ],
          }),
        },
      }),
    ).toThrow(/unknown scoring variable/i);
  });

  it("calls onScore after submit and does not write scores into answers", async () => {
    const seen: ScoreResult[] = [];
    const requests: Request[] = [];
    const form = dimahForm({
      database: memoryAdapter(),
      plugins: [
        scoringPlugin({
          onScore: ({ scores, request }) => {
            seen.push(scores);
            requests.push(request);
          },
        }),
      ],
      forms: { quiz },
    });
    const started = await form.api.startResponse({ body: { formId: "quiz" } });
    const submitted = await form.api.submitResponse({
      body: { responseId: started.id, answers: { q1: "2" } },
    });
    expect(seen).toHaveLength(1);
    expect(requests).toHaveLength(1);
    expect(seen[0]).toMatchObject({
      complete: true,
      variables: { gad7: { raw: 2, missing: 0, complete: true } },
    });
    expect(submitted.answers).toEqual({ q1: "2" });
    const stored = await form.api.getResponse({
      query: { responseId: submitted.id },
    });
    expect(stored.answers).toEqual({ q1: "2" });
  });

  it("does not call onScore for forms without meta.scoring", async () => {
    let called = 0;
    const form = dimahForm({
      database: memoryAdapter(),
      plugins: [
        scoringPlugin({
          onScore: () => {
            called += 1;
          },
        }),
      ],
      forms: { plain },
    });
    const started = await form.api.startResponse({ body: { formId: "plain" } });
    await form.api.submitResponse({
      body: { responseId: started.id, answers: { name: "Ada" } },
    });
    expect(called).toBe(0);
  });

  it("loads a stored response on GET /scoring/response", async () => {
    const form = dimahForm({
      database: memoryAdapter(),
      plugins: [scoringPlugin()],
      forms: { quiz, plain },
    });
    const started = await form.api.startResponse({ body: { formId: "quiz" } });
    await form.api.submitResponse({
      body: { responseId: started.id, answers: { q1: "3" } },
    });
    const scores = await form.api.getResponseScores({
      query: { responseId: started.id },
    });
    expect(scores.variables.gad7.raw).toBe(3);

    const http = await form.handler(
      new Request(
        `http://localhost/api/form/scoring/response?responseId=${encodeURIComponent(started.id)}`,
      ),
    );
    expect(http.ok).toBe(true);
    await expect(http.json()).resolves.toMatchObject({
      complete: true,
      variables: { gad7: { raw: 3 } },
    });

    const plainStart = await form.api.startResponse({
      body: { formId: "plain" },
    });
    await expect(
      form.api.getResponseScores({ query: { responseId: plainStart.id } }),
    ).resolves.toEqual({ variables: {}, complete: true });
  });

  it("uses getResponseScores as the guard operation", async () => {
    const operations: string[] = [];
    const form = dimahForm({
      database: memoryAdapter(),
      plugins: [scoringPlugin()],
      forms: { quiz },
      guard: ({ operation }) => {
        operations.push(operation);
      },
    });
    const started = await form.api.startResponse({ body: { formId: "quiz" } });
    await form.api.getResponseScores({ query: { responseId: started.id } });
    expect(operations).toContain("getResponseScores");
  });

  it("merges scoring error codes onto the instance", () => {
    const form = dimahForm({
      database: memoryAdapter(),
      plugins: [scoringPlugin()],
    });
    expect(form.$ERROR_CODES.SCORING_UNKNOWN_VARIABLE.code).toBe(
      "SCORING_UNKNOWN_VARIABLE",
    );
    expectTypeOf<
      typeof form.$ERROR_CODES.SCORING_UNKNOWN_VARIABLE.code
    >().toEqualTypeOf<"SCORING_UNKNOWN_VARIABLE">();
  });

  it("rejects bad scoring mapping on saveForm with issue codes", async () => {
    const form = dimahForm({
      database: memoryAdapter(),
      plugins: [scoringPlugin()],
    });
    await expect(
      form.api.saveForm({
        body: {
          id: "live",
          title: "Live",
          meta: { scoring: { variables: [{ id: "gad7" }] } },
          fields: [
            {
              id: "q1",
              type: "select",
              options: [{ value: "0", meta: { scoring: { points: 0 } } }],
              meta: { scoring: { variable: "nope" } },
            },
          ],
        },
      }),
    ).rejects.toSatisfy((error: unknown) => {
      if (!isFormErrorCode(error, "VALIDATION_ERROR")) return false;
      return (
        error.issues?.some(
          (issue) => issue.code === "SCORING_UNKNOWN_VARIABLE",
        ) === true
      );
    });
  });

  it("does not treat scoring as answer validation on submit", async () => {
    const optional = defineForm({
      title: "Optional",
      meta: { scoring: { variables: [{ id: "gad7", max: 3 }] } },
      fields: [
        {
          id: "q1",
          type: "select",
          options: likert,
          meta: { scoring: { variable: "gad7" } },
        },
      ],
    });
    const seen: ScoreResult[] = [];
    const form = dimahForm({
      database: memoryAdapter(),
      plugins: [
        scoringPlugin({
          onScore: ({ scores }) => {
            seen.push(scores);
          },
        }),
      ],
      forms: { optional },
    });
    const started = await form.api.startResponse({
      body: { formId: "optional" },
    });
    const submitted = await form.api.submitResponse({
      body: { responseId: started.id, answers: {} },
    });
    expect(submitted.answers).toEqual({});
    expect(seen[0]).toMatchObject({
      complete: false,
      variables: { gad7: { raw: null, missing: 1, complete: false } },
    });
  });

  it("types meta.scoring on createDefineForm", () => {
    const plugins = [scoringPlugin()] as const;
    const defineAppForm = createDefineForm({ plugins });
    const authored = defineAppForm({
      title: "GAD-7",
      meta: { scoring: { variables: [{ id: "gad7", max: 21 }] } },
      fields: [
        {
          id: "q1",
          type: "select",
          options: [{ value: "0", meta: { scoring: { points: 0 } } }],
          meta: { scoring: { variable: "gad7" } },
        },
      ],
    });
    expect(authored.meta?.scoring?.variables[0]?.id).toBe("gad7");
    expect(authored.meta?.scoring?.variables[0]?.max).toBe(21);
    defineAppForm({
      title: "Bad",
      fields: [{ id: "n", type: "text" }],
      // @ts-expect-error scoring.variables must be an array of objects
      meta: { scoring: { variables: 1 } },
    });
  });
});

describe("scoringClientPlugin", () => {
  it("exposes getResponseScores and shared error codes", async () => {
    const plugin = scoringClientPlugin();
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
            variables: { gad7: { raw: 2, missing: 0 } },
            complete: true,
          }),
          { headers: { "content-type": "application/json" } },
        );
      },
    });
    await expect(
      client.getResponseScores({ responseId: "r1" }),
    ).resolves.toMatchObject({
      complete: true,
      variables: { gad7: { raw: 2 } },
    });
    expect(calls[0]).toContain("/scoring/response");
    expect(client.$ERROR_CODES.SCORING_MISSING_POINTS.code).toBe(
      "SCORING_MISSING_POINTS",
    );
    expectTypeOf(client.getResponseScores).toBeFunction();
  });
});
