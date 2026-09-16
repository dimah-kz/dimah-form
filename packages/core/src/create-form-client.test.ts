import { describe, expect, it } from "vitest";

import { createFormClient } from "./create-form-client";
import { APIError, FORM_ERROR_CODES } from "./error";
import { FORM_API_ROUTES } from "./routes";
import { captureFetch, jsonResponse } from "./test/http";

const snapshot = {
  id: "onboarding",
  title: "Onboarding",
  fields: [{ id: "name", type: "text" as const, required: true }],
};

const response = {
  id: "res-1",
  formId: "onboarding",
  status: "draft" as const,
  definition: snapshot,
  answers: {},
  submittedAt: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

describe("createFormClient protocol", () => {
  it.each([
    {
      name: "getForm",
      method: "GET",
      path: FORM_API_ROUTES.form,
      run: (api: ReturnType<typeof createFormClient>) =>
        api.getForm({ formId: "onboarding" }),
    },
    {
      name: "startResponse",
      method: "POST",
      path: FORM_API_ROUTES.startResponse,
      run: (api: ReturnType<typeof createFormClient>) =>
        api.startResponse({ formId: "onboarding" }),
    },
    {
      name: "getResponse",
      method: "GET",
      path: FORM_API_ROUTES.getResponse,
      run: (api: ReturnType<typeof createFormClient>) =>
        api.getResponse({ responseId: "res-1" }),
    },
    {
      name: "saveDraft",
      method: "POST",
      path: FORM_API_ROUTES.saveDraft,
      run: (api: ReturnType<typeof createFormClient>) =>
        api.saveDraft({ responseId: "res-1", answers: { name: "Ada" } }),
    },
    {
      name: "submitResponse",
      method: "POST",
      path: FORM_API_ROUTES.submitResponse,
      run: (api: ReturnType<typeof createFormClient>) =>
        api.submitResponse({ responseId: "res-1", answers: { name: "Ada" } }),
    },
  ] as const)("$name is $method $path", async ({ method, path, run }) => {
    const { fetch, calls } = captureFetch(() => jsonResponse(response));
    const api = createFormClient({ basePath: "/api/form", fetch });
    await run(api);
    expect(calls[0]?.init.method ?? "GET").toBe(method);
    expect(calls[0]?.url).toContain(path);
  });

  it("throws APIError for protocol error JSON", async () => {
    const { fetch } = captureFetch(() =>
      jsonResponse(
        {
          message: FORM_ERROR_CODES.UNKNOWN_FORM.message,
          code: FORM_ERROR_CODES.UNKNOWN_FORM.code,
        },
        404,
      ),
    );
    const api = createFormClient({ fetch });
    await expect(api.getForm({ formId: "missing" })).rejects.toBeInstanceOf(
      APIError,
    );
  });
});
