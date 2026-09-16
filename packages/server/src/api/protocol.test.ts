import { FORM_API_ROUTES } from "@dimah-form/core";
import { describe, expect, it } from "vitest";

import { CORE_ENDPOINT_NAMES, coreEndpoints } from "./routes";

const PROTOCOL = [
  ["getForm", "GET", FORM_API_ROUTES.form],
  ["startResponse", "POST", FORM_API_ROUTES.startResponse],
  ["getResponse", "GET", FORM_API_ROUTES.getResponse],
  ["saveDraft", "POST", FORM_API_ROUTES.saveDraft],
  ["submitResponse", "POST", FORM_API_ROUTES.submitResponse],
] as const;

describe("core protocol", () => {
  it("registers every core endpoint name", () => {
    expect([...CORE_ENDPOINT_NAMES].sort()).toEqual(
      [...PROTOCOL.map(([name]) => name)].sort(),
    );
  });

  it.each(PROTOCOL)("%s is %s %s", (name, method, path) => {
    const endpoint = coreEndpoints[name];
    expect(endpoint.path).toBe(path);
    expect(endpoint.options.method).toBe(method);
  });
});
