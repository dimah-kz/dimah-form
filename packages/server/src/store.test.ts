import { describe, expect, it } from "vitest";

import { memoryAdapter } from "./store";

const row = {
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

describe("memoryAdapter", () => {
  it("isolates rows across adapter instances", async () => {
    const a = memoryAdapter();
    const b = memoryAdapter();
    await a.createResponse(row);
    expect(await b.getResponse("r1")).toBeUndefined();
    expect(await a.getResponse("r1")).toMatchObject({ id: "r1" });
  });

  it("stores live forms without rewriting them on create", async () => {
    const store = memoryAdapter();
    await store.saveForm({
      id: "intake",
      slug: "intake",
      status: "active",
      title: "Intake",
      fields: [{ id: "n", type: "text" }],
    });
    await store.createResponse({
      ...row,
      formId: "intake",
      definition: {
        id: "intake",
        slug: "intake",
        status: "active",
        title: "Old",
        fields: [{ id: "n", type: "text" }],
      },
    });
    expect((await store.getForm("intake"))?.title).toBe("Intake");
    expect(await store.listForms()).toHaveLength(1);
  });

  it("lists forms by updatedAt descending", async () => {
    const store = memoryAdapter();
    await store.saveForm({
      id: "older",
      slug: "older",
      status: "active",
      title: "Older",
      fields: [],
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    });
    await store.saveForm({
      id: "newer",
      slug: "newer",
      status: "active",
      title: "Newer",
      fields: [],
      createdAt: "2026-01-02T00:00:00.000Z",
      updatedAt: "2026-01-02T00:00:00.000Z",
    });
    expect((await store.listForms()).map((form) => form.id)).toEqual([
      "newer",
      "older",
    ]);
  });

  it("filters responses by respondentId", async () => {
    const store = memoryAdapter();
    await store.createResponse(row);
    await store.createResponse({ ...row, id: "r2", respondentId: "user-1" });
    expect(
      (await store.listResponses({ respondentId: "user-1" })).map(
        (item) => item.id,
      ),
    ).toEqual(["r2"]);
  });

  it("looks up a live form by slug", async () => {
    const store = memoryAdapter();
    await store.saveForm({
      id: "intake",
      slug: "join",
      status: "active",
      title: "Intake",
      fields: [],
    });
    expect(await store.getForm("join")).toMatchObject({
      id: "intake",
      slug: "join",
    });
  });

  it("lists forms by status and paginates", async () => {
    const store = memoryAdapter();
    await store.saveForm({
      id: "open",
      slug: "open",
      status: "active",
      title: "Open",
      fields: [],
      updatedAt: "2026-01-02T00:00:00.000Z",
    });
    await store.saveForm({
      id: "closed",
      slug: "closed",
      status: "archived",
      title: "Closed",
      fields: [],
      updatedAt: "2026-01-01T00:00:00.000Z",
    });
    expect(
      (await store.listForms({ status: "archived" })).map((form) => form.id),
    ).toEqual(["closed"]);
    expect(
      (await store.listForms({ limit: 1, offset: 0 })).map((form) => form.id),
    ).toEqual(["open"]);
  });

  it("deletes forms and responses", async () => {
    const store = memoryAdapter();
    await store.saveForm({
      id: "intake",
      slug: "intake",
      status: "active",
      title: "Intake",
      fields: [],
    });
    await store.createResponse(row);
    await store.deleteResponse("r1");
    await store.deleteForm("intake");
    expect(await store.getResponse("r1")).toBeUndefined();
    expect(await store.getForm("intake")).toBeUndefined();
  });

  it("filters responses by formId and status", async () => {
    const store = memoryAdapter();
    await store.createResponse(row);
    await store.createResponse({
      ...row,
      id: "r2",
      formId: "other",
      status: "submitted",
    });
    expect(
      (
        await store.listResponses({ formId: "onboarding", status: "draft" })
      ).map((item) => item.id),
    ).toEqual(["r1"]);
  });

  it("CAS rejects a stale save token", async () => {
    const store = memoryAdapter();
    await store.createResponse(row);
    await expect(
      (async () =>
        store.saveResponse(
          { ...row, answers: { n: 1 }, updatedAt: "newer" },
          { expectedUpdatedAt: "old" },
        ))(),
    ).rejects.toMatchObject({ name: "StoreConflictError" });
    expect((await store.getResponse("r1"))?.answers).toEqual({});
    await store.saveResponse(
      { ...row, answers: { n: 1 }, updatedAt: "newer" },
      { expectedUpdatedAt: "t" },
    );
    expect((await store.getResponse("r1"))?.answers).toEqual({ n: 1 });
  });

  it("returns summaries without answers", async () => {
    const store = memoryAdapter();
    await store.createResponse({ ...row, answers: { name: "Ada" } });
    expect(await store.listResponses({ include: "summary" })).toEqual([
      {
        id: "r1",
        formId: "onboarding",
        status: "draft",
        respondentId: null,
        submittedAt: null,
        createdAt: "t",
        updatedAt: "t",
      },
    ]);
  });

  it("getOrCreateDraft returns the existing draft", async () => {
    const store = memoryAdapter();
    await store.createResponse({ ...row, respondentId: "user-1" });
    const again = await store.getOrCreateDraft({
      ...row,
      id: "r2",
      respondentId: "user-1",
    });
    expect(again.created).toBe(false);
    expect(again.row.id).toBe("r1");
    const other = await store.getOrCreateDraft({
      ...row,
      id: "r3",
      respondentId: "user-2",
    });
    expect(other.created).toBe(true);
    expect(other.row.id).toBe("r3");
  });

  it("findLatestDraft and getOrCreateDraft pick the newest updated draft", async () => {
    const store = memoryAdapter();
    await store.createResponse({
      ...row,
      id: "older",
      respondentId: "user-1",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    });
    await store.createResponse({
      ...row,
      id: "newer",
      respondentId: "user-1",
      createdAt: "2026-01-01T00:00:01.000Z",
      updatedAt: "2026-01-02T00:00:00.000Z",
    });
    expect(
      (
        await store.findLatestDraft({
          formId: "onboarding",
          respondentId: "user-1",
        })
      )?.id,
    ).toBe("newer");
    const again = await store.getOrCreateDraft({
      ...row,
      id: "third",
      respondentId: "user-1",
    });
    expect(again.created).toBe(false);
    expect(again.row.id).toBe("newer");
  });
});
