import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { createFormClient, useFormClient } from "./create-form-client";

describe("createFormClient", () => {
  it("exposes a Provider and the protocol client", () => {
    const client = createFormClient({ basePath: "/api/form" });

    expect(client.baseURL).toBe("/api/form");
    expect(typeof client.Provider).toBe("function");
    expect(typeof client.startResponse).toBe("function");
    expect(typeof client.saveForm).toBe("function");
    expect(typeof client.listForms).toBe("function");
    expect(typeof client.listResponses).toBe("function");
    expect(typeof client.saveDraft).toBe("function");
    expect(typeof client.abandonResponse).toBe("function");
    expect(typeof client.reopenResponse).toBe("function");
    expect(typeof client.deleteForm).toBe("function");
    expect(typeof client.getForm).toBe("function");
    expect(typeof client.getResponse).toBe("function");
    expect(typeof client.submitResponse).toBe("function");
    expect(typeof client.deleteResponse).toBe("function");
    expect(typeof client.useFormClient).toBe("function");
    expect(client.$ERROR_CODES.VALIDATION_ERROR.code).toBe("VALIDATION_ERROR");
  });

  it("provides the client through useFormClient", () => {
    const client = createFormClient({ basePath: "/api/form" });

    function Probe() {
      const inner = client.useFormClient();
      return inner.baseURL;
    }

    expect(
      renderToString(
        createElement(client.Provider, null, createElement(Probe)),
      ),
    ).toBe("/api/form");
  });

  it("throws when useFormClient is used outside Provider", () => {
    function Probe() {
      return useFormClient().baseURL;
    }
    expect(() => renderToString(createElement(Probe))).toThrow(
      /useFormClient must be used under formClient.Provider/,
    );
  });
});
