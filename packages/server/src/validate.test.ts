import { describe, expect, it } from "vitest";

import { isFormErrorCode } from "@dimah-form/core";

import { requireDraft, requireLocked } from "./validate";

function expectErrorCode(
  run: () => void,
  code: "RESPONSE_NOT_DRAFT" | "RESPONSE_NOT_LOCKED",
) {
  let thrown: unknown;
  try {
    run();
  } catch (error) {
    thrown = error;
  }
  expect(isFormErrorCode(thrown, code)).toBe(true);
}

describe("requireDraft", () => {
  it("allows draft rows", () => {
    expect(() => requireDraft({ id: "r1", status: "draft" })).not.toThrow();
  });

  it("rejects submitted and abandoned rows", () => {
    expectErrorCode(
      () => requireDraft({ id: "r1", status: "submitted" }),
      "RESPONSE_NOT_DRAFT",
    );
  });
});

describe("requireLocked", () => {
  it("allows submitted and abandoned rows", () => {
    expect(() =>
      requireLocked({ id: "r1", status: "submitted" }),
    ).not.toThrow();
    expect(() =>
      requireLocked({ id: "r1", status: "abandoned" }),
    ).not.toThrow();
  });

  it("rejects draft rows", () => {
    expectErrorCode(
      () => requireLocked({ id: "r1", status: "draft" }),
      "RESPONSE_NOT_LOCKED",
    );
  });
});
