import { describe, expect, expectTypeOf, it } from "vitest";

import { defineClientPlugin } from "./client-plugin";
import { createFormClient } from "./create-form-client";
import { defineFieldType, defineForm } from "./define";
import { APIError, defineErrorCodes, FORM_ERROR_CODES } from "./error";
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
      name: "reopenResponse",
      method: "POST",
      path: FORM_API_ROUTES.reopenResponse,
      run: (api: ReturnType<typeof createFormClient>) =>
        api.reopenResponse({ responseId: "res-1" }),
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

  it("resolves factory headers per request", async () => {
    const { fetch, calls } = captureFetch(() => jsonResponse(snapshot));
    const api = createFormClient({
      fetch,
      headers: () => ({ authorization: "Bearer t" }),
    });
    await api.getForm({ formId: "onboarding" });
    const sent = new Headers(calls[0]?.init.headers);
    expect(sent.get("authorization")).toBe("Bearer t");
  });

  it("throws APIError for a non-protocol error body", async () => {
    const { fetch } = captureFetch(() =>
      jsonResponse({ error: "upstream" }, 502),
    );
    const api = createFormClient({ fetch });
    await expect(api.getForm({ formId: "missing" })).rejects.toMatchObject({
      message: "upstream",
    });
  });

  it("sends listForms query params", async () => {
    const { fetch, calls } = captureFetch(() =>
      jsonResponse({ forms: [], limit: 10, offset: 20, nextOffset: null }),
    );
    const api = createFormClient({ basePath: "/api/form", fetch });
    await api.listForms({ status: "archived", limit: 10, offset: 20 });
    expect(calls[0]?.url).toContain("status=archived");
    expect(calls[0]?.url).toContain("limit=10");
    expect(calls[0]?.url).toContain("offset=20");
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
    expect(api.fieldTypes).toEqual([]);
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

  it("rejects a plugin endpoint that collides with a React wrapper key", () => {
    const bad = defineClientPlugin({
      id: "bad",
      endpoints: () => ({
        useFormResponse: () => Promise.resolve(undefined),
      }),
    });
    expect(() => createFormClient({ plugins: [bad] })).toThrow(
      /Duplicate dimah-form client endpoint "useFormResponse"/,
    );
  });

  it("rejects a plugin endpoint claimed by two plugins", () => {
    const a = defineClientPlugin({
      id: "a",
      endpoints: () => ({ ping: () => Promise.resolve(1) }),
    });
    const b = defineClientPlugin({
      id: "b",
      endpoints: () => ({ ping: () => Promise.resolve(2) }),
    });
    expect(() => createFormClient({ plugins: [a, b] })).toThrow(
      /Duplicate dimah-form client endpoint "ping"/,
    );
  });

  it("rejects reserved client plugin ids", () => {
    expect(() =>
      createFormClient({
        plugins: [defineClientPlugin({ id: "$fetch" })],
      }),
    ).toThrow(/reserved on the client/);
  });

  it("rejects a missing client plugin dependency", () => {
    expect(() =>
      createFormClient({
        plugins: [defineClientPlugin({ id: "files", dependsOn: ["storage"] })],
      }),
    ).toThrow(/depends on "storage", which is not installed/);
  });

  it("merges client plugin error codes", () => {
    const ping = defineClientPlugin({
      id: "ping",
      $ERROR_CODES: defineErrorCodes({ PING_FAILED: "Ping failed" }),
      endpoints: () => ({ ping: () => Promise.resolve({ ok: true }) }),
    });
    const api = createFormClient({ plugins: [ping] });
    expect(api.$ERROR_CODES.PING_FAILED).toEqual({
      code: "PING_FAILED",
      message: "Ping failed",
    });
    expect(api.$ERROR_CODES.VALIDATION_ERROR.code).toBe("VALIDATION_ERROR");
    expectTypeOf<
      typeof api.$ERROR_CODES.PING_FAILED.code
    >().toEqualTypeOf<"PING_FAILED">();
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

  it("accepts runtime fieldTypes with a server generic", () => {
    const extra = defineFieldType({
      type: "rating",
      validate: () => undefined,
      $Infer: 0 as number,
    });
    type Server = {
      $Infer: {
        forms: Record<string, never>;
        answers: Record<string, never>;
        plugins: [];
      };
    };
    const client = createFormClient<Server>({ fieldTypes: [extra] });
    expect(client.fieldTypes).toEqual([extra]);
  });

  it("merges client plugin fieldTypes onto the client", () => {
    const rating = defineFieldType({
      type: "rating",
      validate: () => undefined,
      format: (value) => String(value),
      $Infer: 0 as number,
    });
    const plugin = defineClientPlugin({
      id: "rating",
      fieldTypes: [rating],
    });
    const forms = {
      scored: defineForm({
        title: "Scored",
        fields: [{ id: "score", type: "rating", required: true }],
      }),
    };
    const client = createFormClient({ plugins: [plugin], forms });
    expect(client.fieldTypes).toEqual([rating]);
    expectTypeOf<
      typeof client.$Infer.answers.scored.score
    >().toEqualTypeOf<number>();
  });

  it("chains client plugin validateAnswers before options.validateAnswers", async () => {
    const order: string[] = [];
    const plugin = defineClientPlugin({
      id: "scoring",
      validateAnswers: () => {
        order.push("plugin");
        return [{ field: "name", message: "plugin", code: "PLUGIN" }];
      },
    });
    const client = createFormClient({
      plugins: [plugin],
      validateAnswers: () => {
        order.push("user");
        return [{ field: "name", message: "user", code: "USER" }];
      },
    });
    await expect(
      client.validateAnswers?.(
        snapshot,
        { name: "Ada" },
        "submit",
      ),
    ).resolves.toEqual([
      { field: "name", message: "plugin", code: "PLUGIN" },
      { field: "name", message: "user", code: "USER" },
    ]);
    expect(order).toEqual(["plugin", "user"]);
  });

  it("rejects a client plugin field type that collides with options", () => {
    const rating = defineFieldType({
      type: "rating",
      validate: () => undefined,
      $Infer: 0 as number,
    });
    const plugin = defineClientPlugin({
      id: "rating",
      fieldTypes: [rating],
    });
    expect(() =>
      createFormClient({ plugins: [plugin], fieldTypes: [rating] }),
    ).toThrow(/Duplicate dimah-form field type "rating"/);
  });

  it("rejects a client plugin field type that shadows a builtin", () => {
    expect(() =>
      createFormClient({
        plugins: [
          defineClientPlugin({
            id: "bad",
            fieldTypes: [
              defineFieldType({
                type: "text",
                validate: () => undefined,
              }),
            ],
          }),
        ],
      }),
    ).toThrow(/conflicts with a built-in type/);
  });
});
