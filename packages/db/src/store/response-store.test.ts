import { describe, expect, it, vi } from "vitest";

import type { DimahFormDbClient } from "./response-store";
import { createDbResponseStore } from "./response-store";
import type { QuestionnaireRow, ResponseRow } from "./map-row";

function row(overrides: Partial<ResponseRow> = {}): ResponseRow {
  return {
    id: "resp-1",
    questionnaireId: "onboarding",
    status: "draft",
    definition: {
      id: "onboarding",
      slug: "onboarding",
      status: "active",
      title: "Onboarding",
      fields: [{ id: "name", type: "text", required: true }],
    },
    answers: {},
    respondentId: null,
    submittedAt: null,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  };
}

function questionnaire(
  overrides: Partial<QuestionnaireRow> = {},
): QuestionnaireRow {
  return {
    id: "onboarding",
    title: "Onboarding",
    definition: {
      title: "Onboarding",
      fields: [{ id: "name", type: "text", required: true }],
    },
    status: "active",
    ...overrides,
  };
}

function createOrm(
  overrides: {
    questionnaire?: QuestionnaireRow | { id: string } | null;
    response?: ResponseRow | null;
    questionnaires?: QuestionnaireRow[];
    responses?: ResponseRow[];
  } = {},
) {
  const forceReturning = vi.fn(async () => row());
  const upsert = vi.fn(() => ({ forceReturning }));
  const create = vi.fn(async () => ({ id: "onboarding" }));
  const findFirst = vi.fn(async (table: string) => {
    if (table === "questionnaire") {
      return overrides.questionnaire === undefined
        ? { id: "onboarding" }
        : overrides.questionnaire;
    }
    return overrides.response === undefined ? row() : overrides.response;
  });
  const findMany = vi.fn(async (table: string) => {
    if (table === "questionnaire") {
      return overrides.questionnaires ?? [questionnaire()];
    }
    return overrides.responses ?? [row()];
  });
  const orm = { upsert, findFirst, create, findMany };
  const db = { orm: () => orm } as unknown as DimahFormDbClient;
  return {
    store: createDbResponseStore(db),
    upsert,
    findFirst,
    create,
    findMany,
  };
}

const record = {
  id: "resp-1",
  formId: "onboarding",
  status: "draft" as const,
  definition: {
    id: "onboarding",
    slug: "onboarding",
    status: "active" as const,
    title: "Onboarding",
    fields: [{ id: "name", type: "text" as const, required: true }],
  },
  answers: {},
  respondentId: null,
  submittedAt: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

describe("createDbResponseStore", () => {
  it("inserts questionnaire only when it is missing", async () => {
    const { store, create, upsert, findFirst } = createOrm({
      questionnaire: null,
    });
    await store.create(record);
    expect(findFirst).toHaveBeenCalledWith("questionnaire", expect.any(Object));
    expect(create).toHaveBeenCalledWith(
      "questionnaire",
      expect.objectContaining({ id: "onboarding" }),
    );
    expect(upsert).toHaveBeenCalledWith("response", expect.any(Object));
  });

  it("does not rewrite an existing questionnaire", async () => {
    const { store, create, upsert } = createOrm({
      questionnaire: { id: "onboarding" },
    });
    await store.create(record);
    expect(create).not.toHaveBeenCalled();
    expect(upsert).toHaveBeenCalledWith("response", expect.any(Object));
  });

  it("loads a mapped record by id", async () => {
    const { store } = createOrm();
    await expect(store.get("resp-1")).resolves.toMatchObject({
      id: "resp-1",
      formId: "onboarding",
      status: "draft",
      respondentId: null,
    });
  });

  it("returns undefined when missing", async () => {
    const { store } = createOrm({ response: null });
    await expect(store.get("missing")).resolves.toBeUndefined();
  });

  it("does not touch questionnaire on save", async () => {
    const { store, upsert, create } = createOrm();
    await store.save(record);
    expect(create).not.toHaveBeenCalled();
    expect(upsert).toHaveBeenCalledTimes(1);
    expect(upsert).toHaveBeenCalledWith("response", expect.any(Object));
  });

  it("upserts a live form on saveForm", async () => {
    const { store, upsert, create } = createOrm();
    await store.saveForm(record.definition);
    expect(create).not.toHaveBeenCalled();
    expect(upsert).toHaveBeenCalledWith("questionnaire", expect.any(Object));
  });

  it("lists live forms and responses", async () => {
    const { store, findMany } = createOrm();
    await expect(store.listForms()).resolves.toEqual([
      {
        id: "onboarding",
        slug: "onboarding",
        status: "active",
        title: "Onboarding",
        fields: [{ id: "name", type: "text", required: true }],
      },
    ]);
    await expect(
      store.listResponses({ formId: "onboarding" }),
    ).resolves.toEqual([record]);
    expect(findMany).toHaveBeenCalledWith("questionnaire", expect.any(Object));
    expect(findMany).toHaveBeenCalledWith("response", expect.any(Object));
  });
});
