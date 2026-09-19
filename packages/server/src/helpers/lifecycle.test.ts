import { describe, expect, it } from "vitest";

import { isFormErrorCode, type ResponseRecord } from "@dimah-form/core";

import {
  commitLifecycle,
  persistedResponse,
  writeForm,
  writeResponse,
} from "./lifecycle";
import { memoryAdapter } from "@/store";

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

describe("writeForm", () => {
  it("returns the stored form after save", async () => {
    const store = memoryAdapter();
    const result = await writeForm(store, {
      id: "intake",
      slug: "intake",
      status: "active",
      title: "Intake",
      fields: [],
    });
    expect(result.updatedAt).toBeDefined();
    expect(await store.getForm("intake")).toEqual(result);
  });
});

describe("writeResponse", () => {
  it("maps a store conflict to STALE_UPDATE", async () => {
    const store = memoryAdapter();
    const record = {
      id: "r1",
      formId: "onboarding",
      status: "draft" as const,
      definition: {
        id: "onboarding",
        slug: "onboarding",
        status: "active" as const,
        title: "Onboarding",
        fields: [],
      },
      answers: {},
      respondentId: null,
      submittedAt: null,
      createdAt: "t",
      updatedAt: "t",
    };
    await store.create(record);
    await expect(
      writeResponse(
        store,
        { ...record, updatedAt: "later" },
        { expectedUpdatedAt: "old" },
      ),
    ).rejects.toSatisfy((error: unknown) =>
      isFormErrorCode(error, "STALE_UPDATE"),
    );
  });
});
