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
    expect(typeof client.deleteForm).toBe("function");
  });

  it("provides the client through useFormClient", () => {
    const client = createFormClient({ basePath: "/api/form" });

    function Probe() {
      const inner = useFormClient();
      return inner.baseURL;
    }

    expect(
      renderToString(
        createElement(client.Provider, null, createElement(Probe)),
      ),
    ).toBe("/api/form");
  });
});
