import { describe, expect, it } from "vitest";

import { createFormClient } from "./create-form-client";

describe("createFormClient", () => {
  it("exposes a Provider and the protocol client", () => {
    const client = createFormClient({ basePath: "/api/form" });

    expect(client.baseURL).toBe("/api/form");
    expect(typeof client.Provider).toBe("function");
  });
});
