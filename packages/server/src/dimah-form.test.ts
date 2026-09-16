import { describe, expect, it } from "vitest";

import { dimahForm } from "./dimah-form";

describe("dimahForm", () => {
  it("returns a handler and error catalog", async () => {
    const form = dimahForm({ basePath: "/api/form" });
    const response = await form.handler(
      new Request("http://localhost/api/form"),
    );

    expect(response.status).toBe(501);
    expect(form.$ERROR_CODES.VALIDATION_ERROR.code).toBe("VALIDATION_ERROR");
  });
});
