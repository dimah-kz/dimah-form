import { describe, expect, it, vi } from "vitest";

import type { DimahFormDbClient } from "./response-store";
import { createDbResponseStore } from "./response-store";
import type { QuestionnaireRow, ResponseRow } from "./map-row";

type ListWhereClause = {
  col: string;
  op: string;
  value: string | Date;
};

type ListWhereBuilder = ((
  col: string,
  op: string,
  value: string | Date,
) => ListWhereClause) & {
  and: (...parts: ListWhereClause[]) => { and: ListWhereClause[] };
};

function listWhereBuilder(): ListWhereBuilder {
  const b = ((col: string, op: string, value: string) => ({
    col,
    op,
    value,
  })) as ListWhereBuilder;
  b.and = (...parts) => ({ and: parts });
  return b;
}

function listWhereFromCall(
  findMany: ReturnType<typeof vi.fn>,
  table = "response",
): unknown {
  const options = findMany.mock.calls.find((call) => call[0] === table)?.[1] as
    { where?: (b: ListWhereBuilder) => unknown } | undefined;
  return options?.where?.(listWhereBuilder());
}

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
  const updateMany = vi.fn(async () => undefined);
  const create = vi.fn(async () => ({ id: "onboarding" }));
  const findFirst = vi.fn(async (table: string) => {
    if (table === "questionnaire") {
      return overrides.questionnaire === undefined
        ? { id: "onboarding" }
        : overrides.questionnaire;
    }
    return overrides.response === undefined ? row() : overrides.response;
  });
  const findMany = vi.fn(async (table: string, _options?: unknown) => {
    if (table === "questionnaire") {
      return overrides.questionnaires ?? [questionnaire()];
    }
    return overrides.responses ?? [row()];
  });
  const deleteMany = vi.fn(async () => undefined);
  const orm = { upsert, updateMany, findFirst, create, findMany, deleteMany };
  const db = { orm: () => orm } as unknown as DimahFormDbClient;
  return {
    store: createDbResponseStore(db),
    upsert,
    updateMany,
    findFirst,
    create,
    findMany,
    deleteMany,
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
    await store.createResponse(record);
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
    await store.createResponse(record);
    expect(create).not.toHaveBeenCalled();
    expect(upsert).toHaveBeenCalledWith("response", expect.any(Object));
  });

  it("loads a mapped record by id", async () => {
    const { store } = createOrm();
    await expect(store.getResponse("resp-1")).resolves.toMatchObject({
      id: "resp-1",
      formId: "onboarding",
      status: "draft",
      respondentId: null,
    });
  });

  it("returns undefined when missing", async () => {
    const { store } = createOrm({ response: null });
    await expect(store.getResponse("missing")).resolves.toBeUndefined();
  });

  it("does not touch questionnaire on save", async () => {
    const { store, upsert, create } = createOrm();
    await store.saveResponse(record);
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

  it("builds listResponses where from provided filters only", async () => {
    const { store, findMany } = createOrm();
    await store.listResponses({
      formId: "onboarding",
      status: "draft",
    });
    expect(listWhereFromCall(findMany)).toEqual({
      and: [
        { col: "questionnaireId", op: "=", value: "onboarding" },
        { col: "status", op: "=", value: "draft" },
      ],
    });
  });

  it("uses a single predicate when only one listResponses filter is set", async () => {
    const { store, findMany } = createOrm();
    await store.listResponses({ formId: "onboarding" });
    expect(listWhereFromCall(findMany)).toEqual({
      col: "questionnaireId",
      op: "=",
      value: "onboarding",
    });
  });

  it("adds submittedAt and updatedAt comparisons", async () => {
    const { store, findMany } = createOrm();
    await store.listResponses({
      formId: "onboarding",
      submittedFrom: "2026-01-01T00:00:00.000Z",
      submittedTo: "2026-01-31T00:00:00.000Z",
      updatedAfter: "2026-01-15T00:00:00.000Z",
    });
    expect(listWhereFromCall(findMany)).toEqual({
      and: [
        { col: "questionnaireId", op: "=", value: "onboarding" },
        {
          col: "submittedAt",
          op: ">=",
          value: new Date("2026-01-01T00:00:00.000Z"),
        },
        {
          col: "submittedAt",
          op: "<=",
          value: new Date("2026-01-31T00:00:00.000Z"),
        },
        {
          col: "updatedAt",
          op: ">",
          value: new Date("2026-01-15T00:00:00.000Z"),
        },
      ],
    });
  });

  it("counts matching response ids without a page window", async () => {
    const { store, findMany } = createOrm({
      responses: [row(), row({ id: "resp-2" })],
    });
    await expect(store.countResponses({ formId: "onboarding" })).resolves.toBe(
      2,
    );
    expect(findMany).toHaveBeenCalledWith(
      "response",
      expect.objectContaining({ select: ["id"] }),
    );
  });

  it("deletes a response and a form", async () => {
    const { store, deleteMany } = createOrm();
    await store.deleteResponse("resp-1");
    await store.deleteForm("onboarding");
    expect(deleteMany).toHaveBeenCalledWith("response", expect.any(Object));
    expect(deleteMany).toHaveBeenCalledWith(
      "questionnaire",
      expect.any(Object),
    );
  });

  it("skips questionnaire rows that cannot be mapped", async () => {
    const { store } = createOrm({
      questionnaires: [
        questionnaire({ status: "nope" }),
        questionnaire({ id: "ok" }),
      ],
    });
    await expect(store.listForms()).resolves.toEqual([
      {
        id: "ok",
        slug: "ok",
        status: "active",
        title: "Onboarding",
        fields: [{ id: "name", type: "text", required: true }],
      },
    ]);
  });

  it("returns undefined for a missing live form", async () => {
    const { store } = createOrm({ questionnaire: null });
    await expect(store.getForm("missing")).resolves.toBeUndefined();
  });

  it("loads a live form by slug after id misses", async () => {
    const { store, findFirst } = createOrm({ questionnaire: null });
    findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(questionnaire({ id: "intake", slug: "join" }));
    await expect(store.getForm("join")).resolves.toMatchObject({
      id: "intake",
      slug: "join",
    });
  });

  it("filters listForms by status", async () => {
    const { store, findMany } = createOrm();
    await store.listForms({ status: "archived" });
    expect(listWhereFromCall(findMany, "questionnaire")).toEqual({
      col: "status",
      op: "=",
      value: "archived",
    });
  });

  it("omits listResponses where when no filters are set", async () => {
    const { store, findMany } = createOrm();
    await store.listResponses();
    const options = findMany.mock.calls.find(
      (call) => call[0] === "response",
    )?.[1] as { where?: unknown } | undefined;
    expect(options?.where).toBeUndefined();
  });

  it("CAS save uses updateMany", async () => {
    const { store, updateMany, upsert } = createOrm();
    await store.saveResponse(record, {
      expectedUpdatedAt: "2026-01-01T00:00:00.000Z",
    });
    expect(updateMany).toHaveBeenCalledWith(
      "response",
      expect.objectContaining({ set: expect.any(Object) }),
    );
    expect(upsert).not.toHaveBeenCalled();
  });

  it("CAS save conflicts when the token is stale even if answers match", async () => {
    const { store } = createOrm({
      response: row({
        answers: {},
        updatedAt: new Date("2026-01-02T00:00:00.000Z"),
      }),
    });
    await expect(
      store.saveResponse(
        {
          ...record,
          answers: {},
          updatedAt: "2026-01-03T00:00:00.000Z",
        },
        { expectedUpdatedAt: "2026-01-01T00:00:00.000Z" },
      ),
    ).rejects.toMatchObject({ name: "StoreConflictError" });
  });

  it("lists response summaries without mapping definition", async () => {
    const { store } = createOrm();
    await expect(store.listResponses({ include: "summary" })).resolves.toEqual([
      {
        id: "resp-1",
        formId: "onboarding",
        status: "draft",
        respondentId: null,
        submittedAt: null,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
    ]);
  });

  it("findLatestDraft limits to one draft row", async () => {
    const { store, findMany } = createOrm({
      responses: [row({ respondentId: "user-1" })],
    });
    await expect(
      store.findLatestDraft({
        formId: "onboarding",
        respondentId: "user-1",
      }),
    ).resolves.toMatchObject({ id: "resp-1" });
    expect(findMany).toHaveBeenCalledWith(
      "response",
      expect.objectContaining({ limit: 1 }),
    );
  });
});
