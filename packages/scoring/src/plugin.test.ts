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

  it("rejects option add mapped to an unknown variable at init", () => {
    expect(() =>
      dimahForm({
        database: memoryAdapter(),
        plugins: [scoringPlugin()],
        forms: {
          quiz: defineForm({
            title: "Quiz",
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
        },
      }),
    ).toThrow(/unknown scoring variable/i);
  });

  it("rejects an unmapped scoring variable at init", () => {
    expect(() =>
      dimahForm({
        database: memoryAdapter(),
        plugins: [scoringPlugin()],
        forms: {
          quiz: defineForm({
            title: "Quiz",
            meta: { scoring: { variables: [{ id: "gad7" }, { id: "ghost" }] } },
            fields: [
              {
                id: "q1",
                type: "select",
                options: [{ value: "0", meta: { scoring: { points: 0 } } }],
                meta: { scoring: { variable: "gad7" } },
              },
            ],
          }),
        },
      }),
    ).toThrow(/not mapped/i);
  });

  it("rejects mixing field variable with option add at init", () => {
    expect(() =>
      dimahForm({
        database: memoryAdapter(),
        plugins: [scoringPlugin()],
        forms: {
          quiz: defineForm({
            title: "Quiz",
            meta: { scoring: { variables: [{ id: "x" }, { id: "y" }] } },
            fields: [
              {
                id: "q1",
                type: "select",
                options: [
                  {
                    value: "a",
                    meta: {
                      scoring: { add: [{ variable: "y", points: 1 }] },
                    },
                  },
                ],
                meta: { scoring: { variable: "x" } },
              },
            ],
          }),
        },
      }),
    ).toThrow(/cannot mix/i);
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

    await expect(
      form.api.getResponseScores({ query: { responseId: "missing" } }),
    ).rejects.toSatisfy((error: unknown) =>
      isFormErrorCode(error, "UNKNOWN_RESPONSE"),
    );
  });

  it("scores option add on GET /scoring/response", async () => {
    const form = dimahForm({
      database: memoryAdapter(),
      plugins: [scoringPlugin()],
      forms: {
        key: defineForm({
          title: "Key",
          meta: { scoring: { variables: [{ id: "x" }, { id: "y" }] } },
          fields: [
            {
              id: "q1",
              type: "select",
              required: true,
              options: [
                {
                  value: "a",
                  meta: { scoring: { add: [{ variable: "x", points: 2 }] } },
                },
                {
                  value: "b",
                  meta: { scoring: { add: [{ variable: "y", points: 3 }] } },
                },
              ],
            },
          ],
        }),
      },
    });
    const started = await form.api.startResponse({ body: { formId: "key" } });
    await form.api.submitResponse({
      body: { responseId: started.id, answers: { q1: "b" } },
    });
    const scores = await form.api.getResponseScores({
      query: { responseId: started.id },
    });
    expect(scores).toMatchObject({
      complete: true,
      variables: {
        x: { raw: 0, complete: true },
        y: { raw: 3, complete: true },
      },
    });
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

  it("scores the stored snapshot after the live questionnaire changes", async () => {
    const form = dimahForm({
      database: memoryAdapter(),
      plugins: [scoringPlugin()],
    });
    const saved = await form.api.saveForm({
      body: {
        id: "live",
        title: "Live",
        meta: { scoring: { variables: [{ id: "gad7", max: 3 }] } },
        fields: [
          {
            id: "q1",
            type: "select",
            required: true,
            options: likert,
            meta: { scoring: { variable: "gad7" } },
          },
        ],
      },
    });
    const started = await form.api.startResponse({ body: { formId: "live" } });
    await form.api.submitResponse({
      body: { responseId: started.id, answers: { q1: "3" } },
    });
    const live = await form.api.getForm({ query: { formId: "live" } });
    await form.api.saveForm({
      body: {
        id: "live",
        title: "Live",
        meta: { scoring: { variables: [{ id: "gad7", max: 6 }] } },
        fields: [
          {
            id: "q1",
            type: "select",
            required: true,
            options: likert,
            meta: { scoring: { variable: "gad7" } },
          },
          {
            id: "q2",
            type: "select",
            required: true,
            options: likert,
            meta: { scoring: { variable: "gad7" } },
          },
        ],
        updatedAt: live.updatedAt ?? saved.updatedAt,
      },
    });
    const scores = await form.api.getResponseScores({
      query: { responseId: started.id },
    });
    expect(scores.variables.gad7).toMatchObject({
      raw: 3,
      max: 3,
      complete: true,
    });
  });

  it("keeps submitted answers when onScore throws", async () => {
    const form = dimahForm({
      database: memoryAdapter(),
      plugins: [
        scoringPlugin({
          onScore: () => {
            throw new Error("score persist failed");
          },
        }),
      ],
      forms: { quiz },
    });
    const started = await form.api.startResponse({ body: { formId: "quiz" } });
    await expect(
      form.api.submitResponse({
        body: { responseId: started.id, answers: { q1: "2" } },
      }),
    ).rejects.toThrow(/score persist failed/);
    const stored = await form.api.getResponse({
      query: { responseId: started.id },
    });
    expect(stored.status).toBe("submitted");
    expect(stored.answers).toEqual({ q1: "2" });
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
    const keyed = defineAppForm({
      title: "Key",
      meta: { scoring: { variables: [{ id: "x" }, { id: "y" }] } },
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
          ],
        },
      ],
    });
    expect(keyed.fields[0]?.options?.[0]?.meta?.scoring).toEqual({
      add: [{ variable: "x", points: 2 }],
    });
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
    expect(calls[0]).toContain("responseId=r1");
    expect(client.$ERROR_CODES.SCORING_MISSING_POINTS.code).toBe(
      "SCORING_MISSING_POINTS",
    );
    expectTypeOf(client.getResponseScores).toBeFunction();
  });

  it("types getResponseScores when the server generic is paired with the plugin tuple", () => {
    type Server = {
      $Infer: {
        forms: { quiz: typeof quiz };
        answers: { quiz: { q1: string } };
        plugins: [];
      };
    };
    const plugins = [scoringClientPlugin()] as const;
    const client = createFormClient<Server, typeof plugins>({
      plugins,
    });
    expect(typeof client.getResponseScores).toBe("function");
    expectTypeOf(client.getResponseScores).toBeFunction();
    expectTypeOf<
      typeof client.$Infer.answers.quiz.q1
    >().toEqualTypeOf<string>();
  });

  it("does not import @dimah-form/server from isomorphic modules", async () => {
    const { readFile } = await import("node:fs/promises");
    const { dirname, join } = await import("node:path");
    const { fileURLToPath } = await import("node:url");
    const dir = dirname(fileURLToPath(import.meta.url));
    const files = [
      "client.ts",
      "score.ts",
      "meta.ts",
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
