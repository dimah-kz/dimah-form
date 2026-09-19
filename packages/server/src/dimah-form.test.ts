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

  it("throws when showWhen points at a missing field", () => {
    expect(() =>
      createInstance({
        forms: {
          job: {
            title: "Job",
            fields: [
              {
                id: "company",
                type: "text",
                showWhen: { field: "employed", equals: true },
              },
            ],
          },
        },
      }),
    ).toThrow(/showWhen on "company" references unknown field "employed"/);
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

  it("returns JSON INTERNAL_ERROR when a hook throws", async () => {
    const form = createInstance({
      hooks: {
        onStart: () => {
          throw new Error("boom");
        },
      },
    });
    const res = await form.handler(
      jsonRequest(apiUrl(FORM_API_ROUTES.startResponse), {
        body: { formId: "onboarding" },
      }),
    );
    await expectErrorCode(res, 500, FORM_ERROR_CODES.INTERNAL_ERROR);
  });

  it("serves the handler at a custom basePath", async () => {
    const form = dimahForm({
      database: memoryAdapter(),
      basePath: "/forms",
      forms: { onboarding },
    });
    const ok = await form.handler(
      new Request("http://localhost/forms/form?formId=onboarding"),
    );
    expect(ok.status).toBe(200);
    const missing = await form.handler(
      new Request("http://localhost/api/form/form?formId=onboarding"),
    );
    await expectErrorCode(missing, 404, FORM_ERROR_CODES.NOT_FOUND);
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

  it("lets guard load a response without re-entering guard", async () => {
    const seen: string[] = [];
    const form = createInstance({
      guard: async ({ operation, responseId, getResponse }) => {
        if (operation !== "getResponse" || !responseId) return;
        const row = await getResponse(responseId);
        seen.push(row?.id ?? "missing");
      },
    });
    const started = await form.api.startResponse({
      body: { formId: "onboarding" },
    });
    await form.api.getResponse({ query: { responseId: started.id } });
    expect(seen).toEqual([started.id]);
  });

  it("runs validateAnswers on submit", async () => {
    const form = dimahForm({
      database: memoryAdapter(),
      forms: { onboarding },
      validateAnswers: (_definition, answers) => {
        if (answers.name === "Nope") {
          return [{ field: "name", message: "Blocked", code: "BLOCKED" }];
        }
        return undefined;
      },
    });
    const started = await form.api.startResponse({
      body: { formId: "onboarding" },
    });
    await expect(
      form.api.submitResponse({
        body: {
          responseId: started.id,
          answers: { name: "Nope", ok: true },
        },
      }),
    ).rejects.toSatisfy((error: unknown) => {
      if (!isFormErrorCode(error, "VALIDATION_ERROR")) return false;
      return (
        (error as APIError).issues?.some((issue) => issue.code === "BLOCKED") ??
        false
      );
    });
  });
});
