import { describe, expect, it } from "vitest";

import type { ResponseRecord } from "@dimah-form/core";

import { commitLifecycle, persistedResponse } from "./lifecycle";

describe("commitLifecycle", () => {
  it("runs after only when persist succeeds", async () => {
    const events: string[] = [];
    await commitLifecycle(
      () => {
        events.push("before");
      },
      () => "ok",
      () => {
        events.push("after");
      },
    );
    expect(events).toEqual(["before", "after"]);
  });

  it("skips after when persist throws", async () => {
    const events: string[] = [];
    await expect(
      commitLifecycle(
        () => {
          events.push("before");
        },
        () => {
          throw new Error("nope");
        },
        () => {
          events.push("after");
        },
      ),
    ).rejects.toThrow("nope");
    expect(events).toEqual(["before"]);
  });
});

describe("persistedResponse", () => {
  const row = { id: "r1" } as ResponseRecord;

  it("returns the re-read row when present", async () => {
    const fresh = { id: "r1", updatedAt: "later" } as ResponseRecord;
    await expect(persistedResponse(async () => fresh, row)).resolves.toBe(
      fresh,
    );
  });

  it("falls back to the written row", async () => {
    await expect(persistedResponse(async () => undefined, row)).resolves.toBe(
      row,
    );
  });
});
