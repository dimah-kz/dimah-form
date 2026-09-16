import { describe, expect, it } from "vitest";

import { defineErrorCodes, FORM_ERROR_CODES } from "../error-codes";
import { mergeErrorCodes } from "./merge-error-codes";

describe("mergeErrorCodes", () => {
  it("returns the core catalog when no plugin codes are present", () => {
    expect(mergeErrorCodes([{ id: "ping" }], "plugin")).toBe(FORM_ERROR_CODES);
  });

  it("merges plugin catalogs", () => {
    const ping = defineErrorCodes({ PING_FAILED: "Ping failed" });
    const merged = mergeErrorCodes(
      [{ id: "ping", $ERROR_CODES: ping }],
      "plugin",
    );
    expect(merged.PING_FAILED).toEqual({
      code: "PING_FAILED",
      message: "Ping failed",
    });
    expect(merged.VALIDATION_ERROR).toEqual(FORM_ERROR_CODES.VALIDATION_ERROR);
  });

  it("rejects a code that shadows core", () => {
    expect(() =>
      mergeErrorCodes(
        [
          {
            id: "ping",
            $ERROR_CODES: defineErrorCodes({
              VALIDATION_ERROR: "Nope",
            }),
          },
        ],
        "plugin",
      ),
    ).toThrow(/Plugin "ping" conflicts with a core code/);
  });

  it("rejects a code claimed by two plugins", () => {
    const codes = defineErrorCodes({ PING_FAILED: "Ping failed" });
    expect(() =>
      mergeErrorCodes(
        [
          { id: "a", $ERROR_CODES: codes },
          { id: "b", $ERROR_CODES: codes },
        ],
        "client plugin",
      ),
    ).toThrow(/Client plugin "b" conflicts with client plugin "a"/);
  });
});
