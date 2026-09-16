import { describe, expect, it } from "vitest";

import { isFormErrorCode } from "@dimah-form/core";

import { assertFresh, requireDraft, requireLocked } from "./validate";

function expectErrorCode(
  run: () => void,
  code: "RESPONSE_NOT_DRAFT" | "RESPONSE_NOT_LOCKED" | "STALE_UPDATE",
) {
  try {
    run();
    throw new Error(`expected ${code}`);
  } catch (error) {
    expect(isFormErrorCode(error, code)).toBe(true);
  }
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

describe("assertFresh", () => {
  it("skips the check when no token is sent", () => {
    expect(() =>
      assertFresh({ updatedAt: "2026-01-01T00:00:00.000Z" }),
    ).not.toThrow();
  });

  it("rejects a mismatched token", () => {
    expectErrorCode(
      () =>
        assertFresh(
          { updatedAt: "2026-01-01T00:00:00.000Z" },
          "2000-01-01T00:00:00.000Z",
        ),
      "STALE_UPDATE",
    );
  });
});
