import { describe, expect, expectTypeOf, it } from "vitest";

import { defineClientPlugin } from "./client-plugin";
import { createFormClient } from "./create-form-client";
import { defineForm } from "./define";
import { APIError, FORM_ERROR_CODES } from "./error";
import { FORM_API_ROUTES } from "./routes";
import { captureFetch, jsonResponse } from "./test/http";

const snapshot = {
  id: "onboarding",
  slug: "onboarding",
  status: "active" as const,
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
  respondentId: null,
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
      name: "saveForm",
      method: "POST",
      path: FORM_API_ROUTES.form,
      run: (api: ReturnType<typeof createFormClient>) => api.saveForm(snapshot),
    },
    {
      name: "listForms",
      method: "GET",
      path: FORM_API_ROUTES.forms,
      run: (api: ReturnType<typeof createFormClient>) => api.listForms(),
    },
    {
      name: "deleteForm",
      method: "POST",
      path: FORM_API_ROUTES.deleteForm,
      run: (api: ReturnType<typeof createFormClient>) =>
        api.deleteForm({ formId: "onboarding" }),
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
      name: "listResponses",
      method: "GET",
      path: FORM_API_ROUTES.responses,
      run: (api: ReturnType<typeof createFormClient>) =>
        api.listResponses({ formId: "onboarding" }),
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
    {
      name: "abandonResponse",
      method: "POST",
      path: FORM_API_ROUTES.abandonResponse,
      run: (api: ReturnType<typeof createFormClient>) =>
        api.abandonResponse({ responseId: "res-1" }),
    },
    {
      name: "deleteResponse",
      method: "POST",
      path: FORM_API_ROUTES.deleteResponse,
      run: (api: ReturnType<typeof createFormClient>) =>
        api.deleteResponse({ responseId: "res-1" }),
    },
  ] as const)("$name is $method $path", async ({ method, path, run }) => {
    const { fetch, calls } = captureFetch(() => jsonResponse(response));
    const api = createFormClient({ basePath: "/api/form", fetch });
    await run(api);
    expect(calls[0]?.init.method ?? "GET").toBe(method);
    expect(calls[0]?.url).toContain(`/api/form${path}`);
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

  it("sends respondentId on listResponses", async () => {
    const { fetch, calls } = captureFetch(() =>
      jsonResponse({
        responses: [],
        limit: 50,
        offset: 0,
        nextOffset: null,
      }),
    );
    const api = createFormClient({ basePath: "/api/form", fetch });
    await api.listResponses({
      formId: "onboarding",
      respondentId: "user-1",
    });
    expect(calls[0]?.url).toContain("respondentId=user-1");
  });

  it("forwards per-call headers", async () => {
    const { fetch, calls } = captureFetch(() => jsonResponse(snapshot));
    const api = createFormClient({ fetch });
    await api.getForm({
      formId: "onboarding",
      headers: { authorization: "Bearer t" },
    });
    const sent = new Headers(calls[0]?.init.headers);
    expect(sent.get("authorization")).toBe("Bearer t");
  });

  it("keeps an absolute baseURL", async () => {
    const { fetch, calls } = captureFetch(() => jsonResponse(snapshot));
    const api = createFormClient({
      baseURL: "https://api.example.com/api/form",
      fetch,
    });
    expect(api.baseURL).toBe("https://api.example.com/api/form");
    await api.getForm({ formId: "onboarding" });
    expect(calls[0]?.url).toContain("https://api.example.com/api/form/form");
  });

  it("merges client plugin endpoints", async () => {
    const ping = defineClientPlugin({
      id: "ping",
      endpoints: ({ $fetch }) => ({
        ping: () => $fetch<{ ok: boolean }>("/ping", { method: "GET" }),
      }),
    });
    const { fetch, calls } = captureFetch(() => jsonResponse({ ok: true }));
    const api = createFormClient({ fetch, plugins: [ping] });
    await expect(api.ping()).resolves.toEqual({ ok: true });
    expect(calls[0]?.url).toContain("/ping");
  });

  it("rejects duplicate client plugin ids", () => {
    const ping = defineClientPlugin({
      id: "ping",
      endpoints: () => ({ ping: () => Promise.resolve({ ok: true }) }),
    });
    expect(() => createFormClient({ plugins: [ping, ping] })).toThrow(
      /Duplicate dimah-form client plugin id "ping"/,
    );
  });

  it("rejects a plugin endpoint that collides with a core method", () => {
    const bad = defineClientPlugin({
      id: "bad",
      endpoints: () => ({ getForm: () => Promise.resolve(snapshot) }),
    });
    expect(() => createFormClient({ plugins: [bad] })).toThrow(
      /Duplicate dimah-form client endpoint "getForm"/,
    );
  });

  it("infers $Infer.answers from options.forms", () => {
    const forms = {
      contact: defineForm({
        title: "Contact",
        fields: [{ id: "name", type: "text", required: true }],
      }),
    };
    const client = createFormClient({ forms });
    expect(client.$ERROR_CODES.VALIDATION_ERROR.code).toBe("VALIDATION_ERROR");
    expectTypeOf<
      typeof client.$Infer.answers.contact.name
    >().toEqualTypeOf<string>();
  });

  it("infers $Infer.answers from a dimahForm-like server type", () => {
    const forms = {
      contact: defineForm({
        title: "Contact",
        fields: [{ id: "name", type: "text", required: true }],
      }),
    };
    type Server = {
      $Infer: {
        forms: typeof forms;
        answers: { contact: { name: string } };
        plugins: [];
      };
    };
    const client = createFormClient<Server>();
    expect(forms.contact.title).toBe("Contact");
    expect(client.$ERROR_CODES.VALIDATION_ERROR.code).toBe("VALIDATION_ERROR");
    expectTypeOf<
      typeof client.$Infer.answers.contact.name
    >().toEqualTypeOf<string>();
    expectTypeOf<typeof client.$Infer.forms>().toEqualTypeOf<typeof forms>();
  });
});
