import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { createFormClient, useFormClient } from "./create-form-client";

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
});
