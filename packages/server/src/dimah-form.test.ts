import { describe, expect, expectTypeOf, it } from "vitest";

import { defineForm, isFormErrorCode } from "@dimah-form/core";

import { createFormEndpoint } from "./api/create-form-endpoint";
import { dimahForm } from "./dimah-form";
import { APIError } from "./errors";
import { definePlugin } from "./plugin/define-plugin";
import { memoryAdapter } from "./store";
import {
  apiUrl,
  createInstance,
  expectErrorCode,
  FORM_API_ROUTES,
  FORM_ERROR_CODES,
  getRequest,
  jsonRequest,
  onboarding,
} from "./test/harness";

describe("dimahForm instance", () => {
  it("exposes handler, api, and the error catalog", () => {
    const form = createInstance();
    expect(typeof form.handler).toBe("function");
    expect(form.api.startResponse).toBeTypeOf("function");
    expect(form.$ERROR_CODES).toBe(FORM_ERROR_CODES);
  });

  it("uses the configured database adapter", async () => {
    const created: string[] = [];
    const memory = memoryAdapter();
    const form = createInstance({
      database: {
        ...memory,
        create(row) {
          created.push(row.id);
          return memory.create(row);
        },
      },
    });
    const started = await form.api.startResponse({
      body: { formId: "onboarding" },
    });
    expect(created).toEqual([started.id]);
  });

  it("throws when database is missing", () => {
    expect(() => {
      // @ts-expect-error database is required
      dimahForm({ forms: { onboarding } });
    }).toThrow(/requires `database`/);
  });

  it("throws when a configured form is invalid", () => {
    expect(() =>
      createInstance({
        forms: { bad: { title: "", fields: [] } },
      }),
    ).toThrow(/Invalid form "bad"/);
  });

  it("throws when a form uses an unregistered field type", () => {
    expect(() =>
      createInstance({
        forms: {
          intake: defineForm({
            title: "Intake",
            fields: [{ id: "email", type: "email", required: true }],
          }),
        },
      }),
    ).toThrow(/Unknown field type "email"/);
  });

  it("throws when a field type is registered twice", () => {
    expect(() =>
      createInstance({
        fieldTypes: [
          {
            type: "text",
            validate: () => undefined,
          },
        ],
      }),
    ).toThrow(/Duplicate dimah-form field type "text"/);
  });
});

describe("HTTP envelope", () => {
  it("returns JSON VALIDATION_ERROR for an invalid body", async () => {
    const form = createInstance();
    const res = await form.handler(
      jsonRequest(apiUrl(FORM_API_ROUTES.startResponse), { body: {} }),
    );
    await expectErrorCode(res, 400, FORM_ERROR_CODES.VALIDATION_ERROR);
  });

  it("returns JSON NOT_FOUND for unknown paths", async () => {
    const form = createInstance();
    const res = await form.handler(
      new Request("http://localhost/api/form/nope", { method: "GET" }),
    );
    await expectErrorCode(res, 404, FORM_ERROR_CODES.NOT_FOUND);
  });

  it("runs the global guard before the endpoint", async () => {
    const form = createInstance({
      guard: () => {
        throw APIError.from("FORBIDDEN", {
          ...FORM_ERROR_CODES.FORBIDDEN,
          message: "blocked",
        });
      },
    });
    const res = await form.handler(
      jsonRequest(apiUrl(FORM_API_ROUTES.startResponse), {
        body: { formId: "onboarding" },
      }),
    );
    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toMatchObject({
      code: "FORBIDDEN",
      message: "blocked",
    });
  });
});

describe("start / draft / submit", () => {
  it("snapshots the live definition at start", async () => {
    const form = createInstance();
    const started = await form.api.startResponse({
      body: { formId: "onboarding" },
    });
    expect(started.status).toBe("draft");
    expect(started.definition).toEqual({
      id: "onboarding",
      slug: "onboarding",
      status: "active",
      ...onboarding,
    });
    expect(started.answers).toEqual({});
  });

  it("returns UNKNOWN_FORM and UNKNOWN_RESPONSE", async () => {
    const form = createInstance();
    const missingForm = await form.handler(
      getRequest(FORM_API_ROUTES.form, { formId: "missing" }),
    );
    await expectErrorCode(missingForm, 404, FORM_ERROR_CODES.UNKNOWN_FORM);

    const missingResponse = await form.handler(
      getRequest(FORM_API_ROUTES.getResponse, { responseId: "nope" }),
    );
    await expectErrorCode(
      missingResponse,
      404,
      FORM_ERROR_CODES.UNKNOWN_RESPONSE,
    );
  });

  it("allows incomplete required fields on draft and rejects them on submit", async () => {
    const form = createInstance();
    const started = await form.api.startResponse({
      body: { formId: "onboarding" },
    });

    const draft = await form.api.saveDraft({
      body: { responseId: started.id, answers: { name: "Ada" } },
    });
    expect(draft.status).toBe("draft");
    expect(draft.answers).toEqual({ name: "Ada" });

    await expect(
      form.api.submitResponse({
        body: { responseId: started.id, answers: { name: "Ada" } },
      }),
    ).rejects.toSatisfy((error: unknown) => {
      if (!isFormErrorCode(error, "VALIDATION_ERROR")) return false;
      return (
        (error as APIError).issues?.some((issue) => issue.field === "ok") ??
        false
      );
    });
  });

  it("submits against the start snapshot after the live form changes", async () => {
    const forms: Record<string, unknown> = { onboarding };
    const form = createInstance({ forms });
    const started = await form.api.startResponse({
      body: { formId: "onboarding" },
    });

    forms.onboarding = defineForm({
      title: "Onboarding v2",
      fields: [
        { id: "name", type: "text", required: true },
        { id: "ok", type: "boolean", required: true },
        { id: "team", type: "text", required: true },
      ],
    });

    const live = await form.api.getForm({ query: { formId: "onboarding" } });
    expect(live.fields.some((field) => field.id === "team")).toBe(true);

    const submitted = await form.api.submitResponse({
      body: {
        responseId: started.id,
        answers: { name: "Ada", ok: true, role: "eng" },
      },
    });
    expect(submitted.status).toBe("submitted");
    expect(submitted.definition.title).toBe("Onboarding");
    expect(
      submitted.definition.fields.some((field) => field.id === "team"),
    ).toBe(false);
  });

  it("rejects a second submit with CONFLICT", async () => {
    const form = createInstance();
    const started = await form.api.startResponse({
      body: { formId: "onboarding" },
    });
    const answers = { name: "Ada", ok: false };
    await form.api.submitResponse({
      body: { responseId: started.id, answers },
    });

    const res = await form.handler(
      jsonRequest(apiUrl(FORM_API_ROUTES.submitResponse), {
        body: { responseId: started.id, answers },
      }),
    );
    await expectErrorCode(res, 409, FORM_ERROR_CODES.CONFLICT);
  });

  it("patches draft answers and deletes keys set to null", async () => {
    const form = createInstance();
    const started = await form.api.startResponse({
      body: { formId: "onboarding" },
    });
    await form.api.saveDraft({
      body: { responseId: started.id, answers: { name: "Ada" } },
    });
    const merged = await form.api.saveDraft({
      body: { responseId: started.id, answers: { ok: true } },
    });
    expect(merged.answers).toEqual({ name: "Ada", ok: true });

    const cleared = await form.api.saveDraft({
      body: { responseId: started.id, answers: { name: null } },
    });
    expect(cleared.answers).toEqual({ ok: true });
  });
});

describe("custom field types", () => {
  const email = {
    type: "email" as const,
    validate: (value: unknown) =>
      typeof value === "string" && value.includes("@")
        ? undefined
        : "Expected an email",
    $Infer: "" as string,
  };

  it("validates submit against the registered type", async () => {
    const form = dimahForm({
      database: memoryAdapter(),
      fieldTypes: [email],
      forms: {
        intake: defineForm({
          title: "Intake",
          fields: [{ id: "email", type: "email", required: true }],
        }),
      },
    });

    const started = await form.api.startResponse({
      body: { formId: "intake" },
    });
    await expect(
      form.api.submitResponse({
        body: { responseId: started.id, answers: { email: "nope" } },
      }),
    ).rejects.toSatisfy((error: unknown) =>
      isFormErrorCode(error, "VALIDATION_ERROR"),
    );

    const submitted = await form.api.submitResponse({
      body: { responseId: started.id, answers: { email: "ada@n" } },
    });
    expect(submitted.status).toBe("submitted");
    expect(submitted.answers).toEqual({ email: "ada@n" });
    expect(submitted.definition.fields[0]?.type).toBe("email");
    expectTypeOf<
      typeof form.$Infer.answers.intake.email
    >().toEqualTypeOf<string>();
  });
});

describe("live catalog", () => {
  it("reads and writes dynamic forms from the database", async () => {
    const form = dimahForm({ database: memoryAdapter() });
    const intake = {
      id: "intake",
      title: "Intake",
      fields: [{ id: "name", type: "text" as const, required: true }],
    };

    await expect(
      form.api.getForm({ query: { formId: "intake" } }),
    ).rejects.toSatisfy((error: unknown) =>
      isFormErrorCode(error, "UNKNOWN_FORM"),
    );

    await expect(form.api.saveForm({ body: intake })).resolves.toEqual({
      ...intake,
      slug: "intake",
      status: "active",
    });
    await expect(
      form.api.getForm({ query: { formId: "intake" } }),
    ).resolves.toEqual({
      ...intake,
      slug: "intake",
      status: "active",
    });

    const listed = await form.api.listForms({});
    expect(listed.forms).toEqual([
      {
        ...intake,
        slug: "intake",
        status: "active",
      },
    ]);
    expect(listed.nextOffset).toBeNull();

    const started = await form.api.startResponse({
      body: { formId: "intake", respondentId: "user-1" },
    });
    expect(started.respondentId).toBe("user-1");
    expect(started.definition.title).toBe("Intake");

    const listedResponses = await form.api.listResponses({
      query: { formId: "intake" },
    });
    expect(listedResponses.responses.map((row) => row.id)).toEqual([
      started.id,
    ]);
  });

  it("keeps extra keys on builtin fields", async () => {
    const form = dimahForm({ database: memoryAdapter() });
    const withHints = {
      id: "hints",
      title: "Hints",
      fields: [
        {
          id: "name",
          type: "text" as const,
          required: true,
          placeholder: "Ada",
        },
      ],
    };
    await expect(form.api.saveForm({ body: withHints })).resolves.toEqual({
      ...withHints,
      slug: "hints",
      status: "active",
    });
    await expect(
      form.api.getForm({ query: { formId: "hints" } }),
    ).resolves.toEqual({
      ...withHints,
      slug: "hints",
      status: "active",
    });
  });

  it("prefers code-authored forms and refuses to overwrite them", async () => {
    const form = createInstance();
    const listed = await form.api.listForms({});
    expect(listed.forms.some((item) => item.id === "onboarding")).toBe(true);

    const res = await form.handler(
      jsonRequest(apiUrl(FORM_API_ROUTES.form), {
        body: { id: "onboarding", title: "Nope", fields: [] },
      }),
    );
    await expectErrorCode(res, 409, FORM_ERROR_CODES.CONFLICT);
  });

  it("does not rewrite a stored live form when starting a code-authored response", async () => {
    const database = memoryAdapter();
    database.saveForm({
      id: "onboarding",
      slug: "onboarding",
      status: "active",
      title: "From DB",
      fields: [{ id: "name", type: "text" }],
    });
    const form = createInstance({ database });
    const live = await form.api.getForm({ query: { formId: "onboarding" } });
    expect(live.title).toBe("Onboarding");
    await form.api.startResponse({ body: { formId: "onboarding" } });
    expect((await database.getForm("onboarding"))?.title).toBe("From DB");
  });
});

describe("hooks and plugins", () => {
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
          type: "email" as const,
          validate: () => undefined,
          $Infer: "" as string,
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
          fields: [{ id: "email", type: "email", required: true }],
        }),
      },
    });

    await expect(form.api.ping({})).resolves.toMatchObject({ ok: true });
    await form.api.startResponse({ body: { formId: "intake" } });
    expect(order).toEqual(["plugin", "user"]);
    expectTypeOf<
      typeof form.$Infer.answers.intake.email
    >().toEqualTypeOf<string>();
  });

  it("runs after-persist hooks after the row is stored", async () => {
    const events: string[] = [];
    const form = createInstance({
      hooks: {
        onSubmit: () => {
          events.push("onSubmit");
        },
        afterSubmit: () => {
          events.push("afterSubmit");
        },
      },
    });
    const started = await form.api.startResponse({
      body: { formId: "onboarding" },
    });
    await form.api.submitResponse({
      body: {
        responseId: started.id,
        answers: { name: "Ada", ok: true },
      },
    });
    expect(events).toEqual(["onSubmit", "afterSubmit"]);
  });

  it("submits stored draft answers when the body omits answers", async () => {
    const form = createInstance();
    const started = await form.api.startResponse({
      body: { formId: "onboarding" },
    });
    const saved = await form.api.saveDraft({
      body: {
        responseId: started.id,
        answers: { name: "Ada", ok: true },
        updatedAt: started.updatedAt,
      },
    });
    const submitted = await form.api.submitResponse({
      body: { responseId: started.id, updatedAt: saved.updatedAt },
    });
    expect(submitted.status).toBe("submitted");
    expect(submitted.answers).toEqual({ name: "Ada", ok: true });
  });

  it("abandons a draft and rejects later drafts", async () => {
    const form = createInstance();
    const started = await form.api.startResponse({
      body: { formId: "onboarding" },
    });
    const abandoned = await form.api.abandonResponse({
      body: { responseId: started.id },
    });
    expect(abandoned.status).toBe("abandoned");
    await expect(
      form.api.saveDraft({
        body: { responseId: started.id, answers: { name: "Ada" } },
      }),
    ).rejects.toSatisfy((error: unknown) => isFormErrorCode(error, "CONFLICT"));
  });

  it("rejects stale draft updates", async () => {
    const form = createInstance();
    const started = await form.api.startResponse({
      body: { formId: "onboarding" },
    });
    await expect(
      form.api.saveDraft({
        body: {
          responseId: started.id,
          answers: { name: "Bob" },
          updatedAt: "2000-01-01T00:00:00.000Z",
        },
      }),
    ).rejects.toSatisfy((error: unknown) =>
      isFormErrorCode(error, "STALE_UPDATE"),
    );
  });

  it("does not start an archived form", async () => {
    const form = dimahForm({
      database: memoryAdapter(),
      forms: {
        closed: defineForm({
          title: "Closed",
          status: "archived",
          fields: [{ id: "name", type: "text" }],
        }),
      },
    });
    await expect(
      form.api.startResponse({ body: { formId: "closed" } }),
    ).rejects.toSatisfy((error: unknown) =>
      isFormErrorCode(error, "FORM_INACTIVE"),
    );
  });

  it("deletes a dynamic form with no responses", async () => {
    const form = dimahForm({ database: memoryAdapter() });
    await form.api.saveForm({
      body: {
        id: "temp",
        title: "Temp",
        fields: [{ id: "n", type: "text" }],
      },
    });
    await expect(
      form.api.deleteForm({ body: { formId: "temp" } }),
    ).resolves.toEqual({ ok: true, formId: "temp" });
    await expect(
      form.api.getForm({ query: { formId: "temp" } }),
    ).rejects.toSatisfy((error: unknown) =>
      isFormErrorCode(error, "UNKNOWN_FORM"),
    );
  });

  it("lists response summaries without answers by default", async () => {
    const form = createInstance();
    const started = await form.api.startResponse({
      body: { formId: "onboarding" },
    });
    await form.api.saveDraft({
      body: { responseId: started.id, answers: { name: "Ada" } },
    });
    const listed = await form.api.listResponses({
      query: { formId: "onboarding" },
    });
    expect(listed.responses[0]).toMatchObject({
      id: started.id,
      status: "draft",
    });
    expect(listed.responses[0]).not.toHaveProperty("answers");
    const full = await form.api.listResponses({
      query: { formId: "onboarding", include: "full" },
    });
    expect(full.responses[0]).toMatchObject({ answers: { name: "Ada" } });
  });

  it("skips invalid stored forms when listing", async () => {
    const database = memoryAdapter();
    database.saveForm({
      id: "broken",
      slug: "broken",
      status: "active",
      title: "Broken",
      fields: [{ id: "x", type: "not-a-type" }],
    });
    const form = createInstance({ database });
    const listed = await form.api.listForms({});
    expect(listed.forms.some((item) => item.id === "broken")).toBe(false);
    expect(listed.forms.some((item) => item.id === "onboarding")).toBe(true);
  });

  it("looks up a form by slug", async () => {
    const form = dimahForm({
      database: memoryAdapter(),
      forms: {
        onboarding: defineForm({
          title: "Onboarding",
          slug: "join",
          fields: [{ id: "name", type: "text", required: true }],
        }),
      },
    });
    await expect(
      form.api.getForm({ query: { formId: "join" } }),
    ).resolves.toMatchObject({ id: "onboarding", slug: "join" });
  });

  it("passes the operation name to guard", async () => {
    const operations: string[] = [];
    const form = createInstance({
      guard: ({ operation, formId }) => {
        operations.push(`${operation}:${formId ?? ""}`);
      },
    });
    await form.api.getForm({ query: { formId: "onboarding" } });
    expect(operations).toEqual(["getForm:onboarding"]);
  });

  it("uses the plugin endpoint name as the guard operation", async () => {
    const operations: string[] = [];
    const ping = definePlugin({
      id: "ping",
      endpoints: {
        ping: createFormEndpoint(
          "/ping",
          { method: "GET", metadata: { operation: "ping" } },
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
    expect(operations).toEqual(["ping"]);
  });
});
