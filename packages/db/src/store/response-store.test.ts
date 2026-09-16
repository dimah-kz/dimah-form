import { describe, expect, it, vi } from "vitest";

import type { DimahFormDbClient } from "./response-store";
import { createDbResponseStore } from "./response-store";
import type { ResponseRow } from "./map-row";

function row(overrides: Partial<ResponseRow> = {}): ResponseRow {
  return {
    id: "resp-1",
    questionnaireId: "onboarding",
    status: "draft",
    respondentId: null,
    scope: null,
    definition: {
      id: "onboarding",
      title: "Onboarding",
      fields: [{ id: "name", type: "text", required: true }],
    },
    answers: {},
    submittedAt: null,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  };
}

function createOrm(overrides: { findFirst?: ResponseRow | null } = {}) {
  const forceReturning = vi.fn(async () => row());
  const upsert = vi.fn(() => ({ forceReturning }));
  const findFirst = vi.fn(async () =>
    overrides.findFirst === undefined ? row() : overrides.findFirst,
  );
  const orm = { upsert, findFirst };
  const db = { orm: () => orm } as unknown as DimahFormDbClient;
  return { store: createDbResponseStore(db), upsert, findFirst };
}

const record = {
  id: "resp-1",
  formId: "onboarding",
  status: "draft" as const,
  definition: {
    id: "onboarding",
    title: "Onboarding",
    fields: [{ id: "name", type: "text" as const, required: true }],
  },
  answers: {},
  submittedAt: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

describe("createDbResponseStore", () => {
  it("upserts questionnaire then response on create", async () => {
    const { store, upsert } = createOrm();
    await store.create(record);
    expect(upsert).toHaveBeenNthCalledWith(
      1,
      "questionnaire",
      expect.any(Object),
    );
    expect(upsert).toHaveBeenNthCalledWith(2, "response", expect.any(Object));
  });

  it("loads a mapped record by id", async () => {
    const { store } = createOrm();
    await expect(store.get("resp-1")).resolves.toMatchObject({
      id: "resp-1",
      formId: "onboarding",
      status: "draft",
    });
  });

  it("returns undefined when missing", async () => {
    const { store } = createOrm({ findFirst: null });
    await expect(store.get("missing")).resolves.toBeUndefined();
  });

  it("does not touch questionnaire on save", async () => {
    const { store, upsert } = createOrm();
    await store.save(record);
    expect(upsert).toHaveBeenCalledTimes(1);
    expect(upsert).toHaveBeenCalledWith("response", expect.any(Object));
  });
});
