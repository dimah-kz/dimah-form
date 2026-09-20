import { describe, expect, expectTypeOf, it } from "vitest";
import * as z from "zod";

import { defineErrorCodes, defineForm, isFormErrorCode } from "@dimah-form/core";

import { createFormEndpoint } from "./api/create-form-endpoint";
import { dimahForm } from "./dimah-form";
import { definePlugin } from "./plugin/define-plugin";
import { getPluginContext } from "./plugin/context";
import { memoryAdapter } from "./store";
import { createInstance } from "./test/harness";

describe("hooks", () => {
  it("runs domain hooks before persist", async () => {
    const events: string[] = [];
    const form = createInstance({
      hooks: {
        onStart: ({ response }) => {
          events.push("start");
          response.respondentId = "hooked";
        },
        onSaveDraft: () => {
          events.push("draft");
        },
        onSubmit: () => {
          events.push("submit");
        },
      },
    });
    const started = await form.api.startResponse({
      body: { formId: "onboarding" },
    });
    expect(started.respondentId).toBe("hooked");
    await form.api.saveDraft({
      body: { responseId: started.id, answers: { name: "Ada" } },
    });
    await form.api.submitResponse({
      body: { responseId: started.id, answers: { name: "Ada", ok: true } },
    });
    expect(events).toEqual(["start", "draft", "submit"]);
  });

  it("runs after-persist hooks after the row is stored", async () => {
    const events: string[] = [];
    const form = createInstance({
      hooks: {
        onStart: () => {
          events.push("onStart");
        },
        afterStart: () => {
          events.push("afterStart");
        },
        onSubmit: () => {
          events.push("onSubmit");
        },
        afterSubmit: () => {
          events.push("afterSubmit");
        },
        onReopen: () => {
          events.push("onReopen");
        },
        afterReopen: () => {
          events.push("afterReopen");
        },
      },
    });
    const started = await form.api.startResponse({
      body: { formId: "onboarding" },
    });
    const submitted = await form.api.submitResponse({
      body: {
        responseId: started.id,
        answers: { name: "Ada", ok: true },
      },
    });
    await form.api.reopenResponse({
      body: { responseId: submitted.id, updatedAt: submitted.updatedAt },
    });
    expect(events).toEqual([
      "onStart",
      "afterStart",
      "onSubmit",
      "afterSubmit",
      "onReopen",
      "afterReopen",
    ]);
  });

  it("skips after-persist hooks when persist throws", async () => {
    const events: string[] = [];
    const memory = memoryAdapter();
    const form = createInstance({
      database: {
        ...memory,
        saveResponse() {
          throw new Error("disk full");
        },
      },
      hooks: {
        onSaveDraft: () => {
          events.push("on");
        },
        afterSaveDraft: () => {
          events.push("after");
        },
      },
    });
    const started = await form.api.startResponse({
      body: { formId: "onboarding" },
    });
    await expect(
      form.api.saveDraft({
        body: { responseId: started.id, answers: { name: "Ada" } },
      }),
    ).rejects.toThrow("disk full");
    expect(events).toEqual(["on"]);
  });
});

describe("plugins", () => {
  it("merges plugin endpoints, field types, and hooks", async () => {
    const order: string[] = [];
    const ping = definePlugin({
      id: "ping",
      endpoints: {
        ping: createFormEndpoint(
          "/ping",
          { method: "GET", metadata: { operation: "ping" } },
          async () => ({
            ok: true,
          }),
        ),
      },
      fieldTypes: [
        {
          type: "rating" as const,
          validate: () => undefined,
          $Infer: 0 as number,
        },
      ],
      hooks: {
        onStart: () => {
          order.push("plugin");
        },
      },
    });
    const form = dimahForm({
      database: memoryAdapter(),
      plugins: [ping],
      hooks: {
        onStart: () => {
          order.push("user");
        },
      },
      forms: {
        intake: defineForm({
          title: "Intake",
          fields: [{ id: "score", type: "rating", required: true }],
        }),
      },
    });

    await expect(form.api.ping({})).resolves.toMatchObject({ ok: true });
    await form.api.startResponse({ body: { formId: "intake" } });
    expect(order).toEqual(["plugin", "user"]);
    expectTypeOf<
      typeof form.$Infer.answers.intake.score
    >().toEqualTypeOf<number>();
  });

  it("uses the plugin endpoint name as the guard operation", async () => {
    const operations: string[] = [];
    const ping = definePlugin({
      id: "ping",
      endpoints: {
        ping: createFormEndpoint("/ping", { method: "GET" }, async () => ({
          ok: true,
        })),
      },
    });
    const form = dimahForm({
      database: memoryAdapter(),
      plugins: [ping],
      guard: ({ operation }) => {
        operations.push(operation);
      },
    });
    await form.api.ping({});
    expect(operations).toEqual(["ping"]);
  });

  it("lets metadata.operation override the endpoint key", async () => {
    const operations: string[] = [];
    const ping = definePlugin({
      id: "ping",
      endpoints: {
        ping: createFormEndpoint(
          "/ping",
          { method: "GET", metadata: { operation: "health" } },
          async () => ({ ok: true }),
        ),
      },
    });
    const form = dimahForm({
      database: memoryAdapter(),
      plugins: [ping],
      guard: ({ operation }) => {
        operations.push(operation);
      },
    });
    await form.api.ping({});
    expect(operations).toEqual(["health"]);
  });

  it("merges plugin error codes onto the instance", () => {
    const ping = definePlugin({
      id: "ping",
      $ERROR_CODES: defineErrorCodes({ PING_FAILED: "Ping failed" }),
    });
    const form = dimahForm({
      database: memoryAdapter(),
      plugins: [ping],
    });
    expect(form.$ERROR_CODES.PING_FAILED).toEqual({
      code: "PING_FAILED",
      message: "Ping failed",
    });
    expect(form.$ERROR_CODES.VALIDATION_ERROR.code).toBe("VALIDATION_ERROR");
    expectTypeOf<
      typeof form.$ERROR_CODES.PING_FAILED.code
    >().toEqualTypeOf<"PING_FAILED">();
  });

  it("runs init in dependsOn order and stores plugin context", async () => {
    const order: string[] = [];
    const a = definePlugin({
      id: "a",
      options: { n: 1 },
      init(ctx) {
        order.push("a");
        expect(ctx.id).toBe("a");
        expect(ctx.basePath).toBe("/api/form");
        expect(ctx.fieldTypes).toBeInstanceOf(Map);
        expect(ctx.plugins.has("b")).toBe(true);
        expect("database" in ctx).toBe(false);
        return { context: { n: (ctx.options as { n: number }).n } };
      },
    });
    const b = definePlugin({
      id: "b",
      dependsOn: ["a"],
      endpoints: {
        peek: createFormEndpoint("/peek", { method: "GET" }, async (ctx) => ({
          a: getPluginContext<{ n: number }>(ctx.context.config, "a"),
        })),
      },
      init({ getPluginContext }) {
        order.push("b");
        expect(getPluginContext<{ n: number }>("a")).toEqual({ n: 1 });
      },
    });
    const form = dimahForm({
      database: memoryAdapter(),
      plugins: [b, a] as const,
    });
    expect(order).toEqual(["a", "b"]);
    await expect(form.api.peek({})).resolves.toEqual({ a: { n: 1 } });
  });

  it("merges plugin metaSchema and skips namespaced keys that are absent", async () => {
    const scoring = definePlugin({
      id: "scoring",
      metaNamespace: "scoring",
      metaSchema: {
        form: z.object({ variables: z.array(z.string()).min(1) }),
      },
    });
    expect(() =>
      dimahForm({
        database: memoryAdapter(),
        plugins: [scoring],
        forms: {
          quiz: defineForm({
            title: "Quiz",
            meta: { scoring: { variables: [] } },
            fields: [{ id: "n", type: "text" }],
          }),
        },
      }),
    ).toThrow(/Invalid form "quiz"/);

    const form = dimahForm({
      database: memoryAdapter(),
      plugins: [scoring],
      forms: {
        plain: defineForm({
          title: "Plain",
          fields: [{ id: "n", type: "text" }],
        }),
        quiz: defineForm({
          title: "Quiz",
          meta: { scoring: { variables: ["gad7"] } },
          fields: [{ id: "n", type: "text" }],
        }),
      },
    });
    await expect(
      form.api.getForm({ query: { formId: "plain" } }),
    ).resolves.toMatchObject({ id: "plain" });
    await expect(
      form.api.getForm({ query: { formId: "quiz" } }),
    ).resolves.toMatchObject({
      meta: { scoring: { variables: ["gad7"] } },
    });
    await expect(
      form.api.saveForm({
        body: {
          id: "live",
          title: "Live",
          meta: { scoring: { variables: [] } },
          fields: [{ id: "n", type: "text" }],
        },
      }),
    ).rejects.toSatisfy((error: unknown) =>
      isFormErrorCode(error, "VALIDATION_ERROR"),
    );
  });

  it("chains plugin validateAnswers before the instance callback", async () => {
    const order: string[] = [];
    const scoring = definePlugin({
      id: "scoring",
      validateAnswers: () => {
        order.push("plugin");
        return [{ field: "name", message: "plugin", code: "PLUGIN" }];
      },
    });
    const form = createInstance({
      plugins: [scoring],
      validateAnswers: () => {
        order.push("user");
        return [{ field: "name", message: "user", code: "USER" }];
      },
    });
    const started = await form.api.startResponse({
      body: { formId: "onboarding" },
    });
    await expect(
      form.api.submitResponse({
        body: {
          responseId: started.id,
          answers: { name: "Ada", ok: true },
        },
      }),
    ).rejects.toSatisfy((error: unknown) =>
      isFormErrorCode(error, "VALIDATION_ERROR"),
    );
    expect(order).toEqual(["plugin", "user"]);
  });

  it("rejects async plugin init", () => {
    expect(() =>
      dimahForm({
        database: memoryAdapter(),
        plugins: [
          {
            id: "async",
            init: (() => Promise.resolve({ context: true })) as never,
          },
        ],
      }),
    ).toThrow(/init\(\) must be synchronous/);
  });
});
