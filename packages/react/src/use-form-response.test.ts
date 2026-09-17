import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { createFormClient } from "./create-form-client";
import { useFormResponse } from "./use-form-response";

const snapshot = {
  id: "onboarding",
  slug: "onboarding",
  status: "active" as const,
  title: "Onboarding",
  fields: [
    { id: "role", type: "select" as const, defaultValue: "eng" },
    { id: "name", type: "text" as const, required: true },
  ],
};

describe("useFormResponse", () => {
  it("binds to the client instance without a Provider", () => {
    const client = createFormClient({ basePath: "/api/form" });

    function Probe() {
      const form = client.useFormResponse({ snapshot });
      return `${form.snapshot.title}:${String(form.answers.role)}`;
    }

    expect(renderToString(createElement(Probe))).toBe("Onboarding:eng");
  });

  it("reads the client from Provider when unbound", () => {
    const client = createFormClient({ basePath: "/api/form" });

    function Probe() {
      const form = useFormResponse({ snapshot });
      return form.snapshot.title;
    }

    expect(
      renderToString(
        createElement(client.Provider, null, createElement(Probe)),
      ),
    ).toBe("Onboarding");
  });

  it("throws without a client or Provider", () => {
    function Probe() {
      return useFormResponse({ snapshot }).snapshot.title;
    }
    expect(() => renderToString(createElement(Probe))).toThrow(
      /useFormResponse requires a client option or formClient.Provider/,
    );
  });
});
