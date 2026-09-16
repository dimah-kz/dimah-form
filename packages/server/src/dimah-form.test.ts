import { describe, expect, expectTypeOf, it } from "vitest";
import * as z from "zod";

import {
  defineErrorCodes,
  defineForm,
  isFormErrorCode,
} from "@dimah-form/core";

import { createFormEndpoint } from "./api/create-form-endpoint";
import { dimahForm } from "./dimah-form";
import { APIError } from "./errors";
import { definePlugin } from "./plugin/define-plugin";
import { getPluginContext } from "./plugin/context";
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
    expect(form.api.reopenResponse).toBeTypeOf("function");
    expect(form.$ERROR_CODES).toEqual(FORM_ERROR_CODES);
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
            fields: [{ id: "file", type: "file", required: true }],
          }),
        },
      }),
    ).toThrow(/Unknown field type "file"/);
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

  it("rejects a second submit with RESPONSE_NOT_DRAFT", async () => {
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
    await expectErrorCode(res, 409, FORM_ERROR_CODES.RESPONSE_NOT_DRAFT);
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
  const handle = {
    type: "handle" as const,
    validate: (value: unknown) =>
      typeof value === "string" && value.startsWith("@")
        ? undefined
        : "Expected a handle",
    $Infer: "" as string,
  };

  it("validates submit against the registered type", async () => {
    const form = dimahForm({
      database: memoryAdapter(),
      fieldTypes: [handle],
      forms: {
        intake: defineForm({
          title: "Intake",
          fields: [{ id: "handle", type: "handle", required: true }],
        }),
      },
    });

    const started = await form.api.startResponse({
      body: { formId: "intake" },
    });
    await expect(
      form.api.submitResponse({
        body: { responseId: started.id, answers: { handle: "nope" } },
      }),
    ).rejects.toSatisfy((error: unknown) =>
      isFormErrorCode(error, "VALIDATION_ERROR"),
    );

    const submitted = await form.api.submitResponse({
      body: { responseId: started.id, answers: { handle: "@ada" } },
    });
    expect(submitted.status).toBe("submitted");
    expect(submitted.answers).toEqual({ handle: "@ada" });
    expect(submitted.definition.fields[0]?.type).toBe("handle");
    expectTypeOf<
      typeof form.$Infer.answers.intake.handle
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

    const saved = await form.api.saveForm({ body: intake });
    expect(saved).toMatchObject({
      ...intake,
      slug: "intake",
      status: "active",
    });
    expect(saved.createdAt).toEqual(expect.any(String));
    expect(saved.updatedAt).toEqual(expect.any(String));
    await expect(
      form.api.getForm({ query: { formId: "intake" } }),
    ).resolves.toMatchObject({
      ...intake,
      slug: "intake",
      status: "active",
      createdAt: saved.createdAt,
      updatedAt: saved.updatedAt,
    });

    const listed = await form.api.listForms({});
    expect(listed.forms).toHaveLength(1);
    expect(listed.forms[0]).toMatchObject({
      ...intake,
      slug: "intake",
      status: "active",
    });
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
    await expect(
      form.api.listResponses({
        query: { formId: "intake", respondentId: "user-1" },
      }),
    ).resolves.toMatchObject({ responses: [{ id: started.id }] });
    await expect(
      form.api.listResponses({
        query: { formId: "intake", respondentId: "other" },
      }),
    ).resolves.toMatchObject({ responses: [] });
  });

  it("round-trips meta on builtin fields", async () => {
    const form = dimahForm({ database: memoryAdapter() });
    const withHints = {
      id: "hints",
      title: "Hints",
      fields: [
        {
          id: "name",
          type: "text" as const,
          required: true,
          meta: { placeholder: "Ada" },
        },
      ],
    };
    await expect(form.api.saveForm({ body: withHints })).resolves.toMatchObject(
      {
        ...withHints,
        slug: "hints",
        status: "active",
      },
    );
    await expect(
      form.api.getForm({ query: { formId: "hints" } }),
    ).resolves.toMatchObject({
      ...withHints,
      slug: "hints",
      status: "active",
    });
  });

  it("rejects unknown keys on builtin fields", async () => {
    const form = dimahForm({ database: memoryAdapter() });
    await expect(
      form.api.saveForm({
        body: {
          id: "hints",
          title: "Hints",
          fields: [
            { id: "name", type: "text", required: true, placeholder: "Ada" },
          ],
        },
      }),
    ).rejects.toSatisfy((error: unknown) =>
      isFormErrorCode(error, "VALIDATION_ERROR"),
    );
  });

  it("round-trips description and meta on the form document", async () => {
    const form = dimahForm({ database: memoryAdapter() });
    const withCopy = {
      id: "copy",
      title: "Copy",
      description: "Shown in the consumer UI",
      meta: { locale: "en" },
      fields: [{ id: "n", type: "text" as const }],
    };
    await expect(form.api.saveForm({ body: withCopy })).resolves.toMatchObject({
      description: "Shown in the consumer UI",
      meta: { locale: "en" },
      slug: "copy",
      status: "active",
    });
    await expect(
      form.api.getForm({ query: { formId: "copy" } }),
    ).resolves.toMatchObject({
      description: "Shown in the consumer UI",
      meta: { locale: "en" },
    });
  });

  it("validates form and field meta against dimahForm metaSchema", async () => {
    expect(() =>
      dimahForm({
        database: memoryAdapter(),
        metaSchema: {
          form: z.object({ locale: z.string() }),
        },
        forms: {
          copy: defineForm({
            title: "Copy",
            fields: [{ id: "n", type: "text" }],
          }),
        },
      }),
    ).toThrow(/Invalid form "copy"/);

    const form = dimahForm({
      database: memoryAdapter(),
      metaSchema: {
        form: z.object({ locale: z.string() }),
        field: z.object({ placeholder: z.string().optional() }),
        option: z.object({ icon: z.string().optional() }),
      },
    });
    await expect(
      form.api.saveForm({
        body: {
          id: "copy",
          title: "Copy",
          meta: { locale: "en" },
          fields: [
            {
              id: "role",
              type: "select",
              options: [{ value: "eng", meta: { icon: "cpu" } }],
            },
          ],
        },
      }),
    ).resolves.toMatchObject({ meta: { locale: "en" } });
    await expect(
      form.api.saveForm({
        body: {
          id: "bad",
          title: "Bad",
          fields: [{ id: "n", type: "text", meta: { placeholder: 1 } }],
        },
      }),
    ).rejects.toSatisfy((error: unknown) =>
      isFormErrorCode(error, "VALIDATION_ERROR"),
    );
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
    await expectErrorCode(res, 409, FORM_ERROR_CODES.CODE_AUTHORED_FORM);
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
      "onSubmit",
      "afterSubmit",
      "onReopen",
      "afterReopen",
    ]);
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
    ).rejects.toSatisfy((error: unknown) =>
      isFormErrorCode(error, "RESPONSE_NOT_DRAFT"),
    );
  });

  it("reopens a submitted response without rewriting the snapshot", async () => {
    const form = createInstance();
    const started = await form.api.startResponse({
      body: { formId: "onboarding" },
    });
    const answers = { name: "Ada", ok: true };
    const submitted = await form.api.submitResponse({
      body: { responseId: started.id, answers },
    });
    const reopened = await form.api.reopenResponse({
      body: {
        responseId: submitted.id,
        updatedAt: submitted.updatedAt,
      },
    });
    expect(reopened.status).toBe("draft");
    expect(reopened.answers).toEqual(answers);
    expect(reopened.definition).toEqual(submitted.definition);
    expect(reopened.submittedAt).toBe(submitted.submittedAt);
  });

  it("reopens an abandoned response to draft", async () => {
    const form = createInstance();
    const started = await form.api.startResponse({
      body: { formId: "onboarding" },
    });
    const abandoned = await form.api.abandonResponse({
      body: { responseId: started.id },
    });
    const reopened = await form.api.reopenResponse({
      body: { responseId: abandoned.id, updatedAt: abandoned.updatedAt },
    });
    expect(reopened.status).toBe("draft");
    expect(reopened.answers).toEqual(started.answers);
    expect(reopened.definition).toEqual(started.definition);
  });

  it("rejects reopen on a draft with RESPONSE_NOT_LOCKED", async () => {
    const form = createInstance();
    const started = await form.api.startResponse({
      body: { formId: "onboarding" },
    });
    await expect(
      form.api.reopenResponse({ body: { responseId: started.id } }),
    ).rejects.toSatisfy((error: unknown) =>
      isFormErrorCode(error, "RESPONSE_NOT_LOCKED"),
    );
  });

  it("rejects a stale reopen token", async () => {
    const form = createInstance();
    const started = await form.api.startResponse({
      body: { formId: "onboarding" },
    });
    const submitted = await form.api.submitResponse({
      body: {
        responseId: started.id,
        answers: { name: "Ada", ok: true },
      },
    });
    await expect(
      form.api.reopenResponse({
        body: {
          responseId: submitted.id,
          updatedAt: "2000-01-01T00:00:00.000Z",
        },
      }),
    ).rejects.toSatisfy((error: unknown) =>
      isFormErrorCode(error, "STALE_UPDATE"),
    );
  });

  it("saves a draft and submits again after reopen", async () => {
    const form = createInstance();
    const started = await form.api.startResponse({
      body: { formId: "onboarding" },
    });
    const submitted = await form.api.submitResponse({
      body: {
        responseId: started.id,
        answers: { name: "Ada", ok: true },
      },
    });
    const reopened = await form.api.reopenResponse({
      body: {
        responseId: submitted.id,
        updatedAt: submitted.updatedAt,
      },
    });
    const saved = await form.api.saveDraft({
      body: {
        responseId: reopened.id,
        answers: { name: "Bob" },
        updatedAt: reopened.updatedAt,
      },
    });
    expect(saved.status).toBe("draft");
    expect(saved.answers).toEqual({ name: "Bob", ok: true });
    const resubmitted = await form.api.submitResponse({
      body: {
        responseId: saved.id,
        answers: { name: "Bob", ok: false },
        updatedAt: saved.updatedAt,
      },
    });
    expect(resubmitted.status).toBe("submitted");
    expect(resubmitted.answers).toEqual({ name: "Bob", ok: false });
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
      init() {
        order.push("a");
        return { context: { n: 1 } };
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

describe("v1 protocol freeze", () => {
  it("validates draft against merged sibling answers", async () => {
    const confirm = {
      type: "confirm" as const,
      validate: (
        value: unknown,
        _field: { type: string },
        context?: { answers: Record<string, unknown> },
      ) => (value === context?.answers.password ? undefined : "Must match"),
    };
    const form = dimahForm({
      database: memoryAdapter(),
      fieldTypes: [confirm],
      forms: {
        signup: defineForm({
          title: "Signup",
          fields: [
            { id: "password", type: "text", required: true },
            { id: "confirm", type: "confirm", required: true },
          ],
        }),
      },
    });
    const started = await form.api.startResponse({
      body: { formId: "signup" },
    });
    await form.api.saveDraft({
      body: { responseId: started.id, answers: { password: "secret" } },
    });
    await expect(
      form.api.saveDraft({
        body: { responseId: started.id, answers: { confirm: "nope" } },
      }),
    ).rejects.toSatisfy((error: unknown) =>
      isFormErrorCode(error, "VALIDATION_ERROR"),
    );
    const saved = await form.api.saveDraft({
      body: { responseId: started.id, answers: { confirm: "secret" } },
    });
    expect(saved.answers).toEqual({ password: "secret", confirm: "secret" });
  });

  it("seeds defaultValue and strips hidden fields on start and submit", async () => {
    const form = dimahForm({
      database: memoryAdapter(),
      forms: {
        job: defineForm({
          title: "Job",
          fields: [
            {
              id: "employed",
              type: "boolean",
              required: true,
              defaultValue: false,
            },
            {
              id: "company",
              type: "text",
              required: true,
              defaultValue: "Acme",
              showWhen: { field: "employed", equals: true },
            },
          ],
        }),
      },
    });
    const started = await form.api.startResponse({ body: { formId: "job" } });
    expect(started.answers).toEqual({ employed: false });
    const submitted = await form.api.submitResponse({
      body: {
        responseId: started.id,
        answers: { employed: false, company: "Acme" },
      },
    });
    expect(submitted.answers).toEqual({ employed: false });
  });

  it("deletes a response", async () => {
    const form = createInstance();
    const started = await form.api.startResponse({
      body: { formId: "onboarding" },
    });
    await expect(
      form.api.deleteResponse({ body: { responseId: started.id } }),
    ).resolves.toEqual({ ok: true, responseId: started.id });
    await expect(
      form.api.getResponse({ query: { responseId: started.id } }),
    ).rejects.toSatisfy((error: unknown) =>
      isFormErrorCode(error, "UNKNOWN_RESPONSE"),
    );
  });

  it("refuses to delete a form that still has responses", async () => {
    const form = dimahForm({ database: memoryAdapter() });
    await form.api.saveForm({
      body: {
        id: "temp",
        title: "Temp",
        fields: [{ id: "n", type: "text" }],
      },
    });
    await form.api.startResponse({ body: { formId: "temp" } });
    await expect(
      form.api.deleteForm({ body: { formId: "temp" } }),
    ).rejects.toSatisfy((error: unknown) =>
      isFormErrorCode(error, "FORM_HAS_RESPONSES"),
    );
  });

  it("refuses to delete a code-authored form", async () => {
    const form = createInstance();
    await expect(
      form.api.deleteForm({ body: { formId: "onboarding" } }),
    ).rejects.toSatisfy((error: unknown) =>
      isFormErrorCode(error, "CODE_AUTHORED_FORM"),
    );
  });

  it("rejects a taken slug", async () => {
    const form = dimahForm({ database: memoryAdapter() });
    await form.api.saveForm({
      body: {
        id: "one",
        slug: "join",
        title: "One",
        fields: [{ id: "n", type: "text" }],
      },
    });
    await expect(
      form.api.saveForm({
        body: {
          id: "two",
          slug: "join",
          title: "Two",
          fields: [{ id: "n", type: "text" }],
        },
      }),
    ).rejects.toSatisfy((error: unknown) =>
      isFormErrorCode(error, "SLUG_TAKEN"),
    );
  });

  it("rejects stale submit and abandon tokens", async () => {
    const form = createInstance();
    const started = await form.api.startResponse({
      body: { formId: "onboarding" },
    });
    await expect(
      form.api.submitResponse({
        body: {
          responseId: started.id,
          answers: { name: "Ada", ok: true },
          updatedAt: "2000-01-01T00:00:00.000Z",
        },
      }),
    ).rejects.toSatisfy((error: unknown) =>
      isFormErrorCode(error, "STALE_UPDATE"),
    );
    await expect(
      form.api.abandonResponse({
        body: {
          responseId: started.id,
          updatedAt: "2000-01-01T00:00:00.000Z",
        },
      }),
    ).rejects.toSatisfy((error: unknown) =>
      isFormErrorCode(error, "STALE_UPDATE"),
    );
  });

  it("paginates listForms and listResponses with nextOffset", async () => {
    const form = dimahForm({ database: memoryAdapter() });
    await form.api.saveForm({
      body: {
        id: "a",
        title: "A",
        fields: [{ id: "n", type: "text" }],
      },
    });
    await form.api.saveForm({
      body: {
        id: "b",
        title: "B",
        fields: [{ id: "n", type: "text" }],
      },
    });
    const page = await form.api.listForms({ query: { limit: 1, offset: 0 } });
    expect(page.forms).toHaveLength(1);
    expect(page.nextOffset).toBe(1);
    const rest = await form.api.listForms({
      query: { limit: 1, offset: page.nextOffset ?? 0 },
    });
    expect(rest.forms).toHaveLength(1);
    expect(rest.nextOffset).toBeNull();

    await form.api.startResponse({ body: { formId: "a" } });
    await form.api.startResponse({ body: { formId: "b" } });
    const responses = await form.api.listResponses({
      query: { limit: 1, offset: 0 },
    });
    expect(responses.responses).toHaveLength(1);
    expect(responses.nextOffset).toBe(1);
  });

  it("rejects saveForm with an unknown field type", async () => {
    const form = dimahForm({ database: memoryAdapter() });
    await expect(
      form.api.saveForm({
        body: {
          id: "x",
          title: "X",
          fields: [{ id: "f", type: "file" }],
        },
      }),
    ).rejects.toSatisfy((error: unknown) =>
      isFormErrorCode(error, "UNKNOWN_FIELD_TYPE"),
    );
  });
});
