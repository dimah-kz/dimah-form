import { describe, expect, it } from "vitest";

import { defineForm, isFormErrorCode } from "@dimah-form/core";

import { dimahForm } from "./dimah-form";
import { APIError } from "./errors";
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
        create(row) {
          created.push(row.id);
          return memory.create(row);
        },
        get: (id) => memory.get(id),
        save: (row) => memory.save(row),
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
    expect(started.definition).toEqual({ id: "onboarding", ...onboarding });
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
    const forms = { onboarding };
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
});
