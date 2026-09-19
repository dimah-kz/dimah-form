import { describe, expect, expectTypeOf, it } from "vitest";

import { defineForm, isFormErrorCode } from "@dimah-form/core";

import { dimahForm } from "./dimah-form";
import type { APIError } from "./errors";
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
});

describe("abandon / reopen", () => {
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
});

describe("concurrency and delete", () => {
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
});

describe("resume draft", () => {
  it("returns the latest draft for the respondent", async () => {
    const form = createInstance();
    const first = await form.api.startResponse({
      body: { formId: "onboarding", respondentId: "user-1" },
    });
    await form.api.saveDraft({
      body: { responseId: first.id, answers: { name: "Ada" } },
    });
    const resumed = await form.api.startResponse({
      body: { formId: "onboarding", respondentId: "user-1", resume: true },
    });
    expect(resumed.id).toBe(first.id);
    expect(resumed.answers).toEqual({ name: "Ada" });

    const other = await form.api.startResponse({
      body: { formId: "onboarding", respondentId: "user-2", resume: true },
    });
    expect(other.id).not.toBe(first.id);
  });

  it("rejects resume without respondentId", async () => {
    const form = createInstance();
    await expect(
      form.api.startResponse({
        body: { formId: "onboarding", resume: true },
      }),
    ).rejects.toSatisfy((error: unknown) =>
      isFormErrorCode(error, "RESUME_REQUIRES_RESPONDENT"),
    );
  });
});
