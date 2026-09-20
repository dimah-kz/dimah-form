import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, expectTypeOf, it } from "vitest";
import { defineForm, type FormAnswers } from "@dimah-form/core";

import { createFormClient, useFormClient } from "./create-form-client";
import type { FormResponseApi } from "./use-form-response";

describe("createFormClient", () => {
  it("exposes a Provider and the protocol client", () => {
    const client = createFormClient({ basePath: "/api/form" });

    expect(client.baseURL).toBe("/api/form");
    expect(typeof client.Provider).toBe("function");
    expect(typeof client.useFormClient).toBe("function");
    expect(typeof client.useFormResponse).toBe("function");
    expect(typeof client.getForm).toBe("function");
    expect(typeof client.startResponse).toBe("function");
    expect(client.fieldTypes).toEqual([]);
    expect(client.$ERROR_CODES.VALIDATION_ERROR.code).toBe("VALIDATION_ERROR");
  });

  it("returns the instance from useFormClient without a Provider", () => {
    const client = createFormClient({ basePath: "/api/form" });

    function Probe() {
      return client.useFormClient().baseURL;
    }

    expect(renderToString(createElement(Probe))).toBe("/api/form");
  });

  it("throws when the unbound useFormClient is used outside Provider", () => {
    function Probe() {
      return useFormClient().baseURL;
    }
    expect(() => renderToString(createElement(Probe))).toThrow(
      /useFormClient must be used under formClient.Provider/,
    );
  });

  it("types bound useFormResponse from a catalog key", () => {
    const forms = {
      contact: defineForm({
        title: "Contact",
        fields: [{ id: "name", type: "text", required: true }],
      }),
    };
    const client = createFormClient({ forms });

    expect(forms.contact.title).toBe("Contact");
    expectTypeOf(client.useFormResponse<"contact">).returns.toEqualTypeOf<
      FormResponseApi<{ name: string }>
    >();
    expectTypeOf(
      client.useFormResponse<{ name: string }>,
    ).returns.toEqualTypeOf<FormResponseApi<{ name: string }>>();
    expectTypeOf(client.useFormResponse).returns.toEqualTypeOf<
      FormResponseApi<FormAnswers>
    >();

    const { useFormResponse } = client;
    expectTypeOf(useFormResponse<"contact">).returns.toEqualTypeOf<
      FormResponseApi<{ name: string }>
    >();
  });

  it("types bound useFormResponse from a server $Infer catalog", () => {
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
    const { useFormResponse } = client;

    expect(forms.contact.title).toBe("Contact");
    expectTypeOf(useFormResponse<"contact">).returns.toEqualTypeOf<
      FormResponseApi<{ name: string }>
    >();
  });
});
