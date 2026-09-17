import { describe, expect, expectTypeOf, it } from "vitest";

import { defineErrorCodes, defineForm } from "@dimah-form/core";

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
        save() {
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
      init({ options }) {
        order.push("a");
        return { context: { n: (options as { n: number }).n } };
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
      init() {
        order.push("b");
      },
    });
    const form = dimahForm({
      database: memoryAdapter(),
      plugins: [b, a] as const,
    });
    expect(order).toEqual(["a", "b"]);
    await expect(form.api.peek({})).resolves.toEqual({ a: { n: 1 } });
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
