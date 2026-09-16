import { FORM_API_OPERATIONS } from "@dimah-form/core";
import { describe, expect, it } from "vitest";

import { CORE_ENDPOINT_NAMES, coreEndpoints } from "./routes";

describe("core protocol", () => {
  it("registers every core endpoint name", () => {
    expect([...CORE_ENDPOINT_NAMES].sort()).toEqual(
      Object.keys(FORM_API_OPERATIONS).sort(),
    );
  });

  it.each(
    Object.entries(FORM_API_OPERATIONS).map(([name, spec]) => ({
      name,
      method: spec.method,
      path: spec.path,
    })),
  )("$name is $method $path", ({ name, method, path }) => {
    const endpoint = coreEndpoints[name as keyof typeof coreEndpoints];
    expect(endpoint.path).toBe(path);
    expect(endpoint.options.method).toBe(method);
  });
});
