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
  it("isolates rows across adapter instances", () => {
    const a = memoryAdapter();
    const b = memoryAdapter();
    a.create(row);
    expect(b.get("r1")).toBeUndefined();
    expect(a.get("r1")).toMatchObject({ id: "r1" });
  });

  it("stores live forms without rewriting them on create", async () => {
    const store = memoryAdapter();
    store.saveForm({
      id: "intake",
      slug: "intake",
      status: "active",
      title: "Intake",
      fields: [{ id: "n", type: "text" }],
    });
    store.create({
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
    store.saveForm({
      id: "older",
      slug: "older",
      status: "active",
      title: "Older",
      fields: [],
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    });
    store.saveForm({
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
    store.create(row);
    store.create({ ...row, id: "r2", respondentId: "user-1" });
    expect(
      (await store.listResponses({ respondentId: "user-1" })).map(
        (item) => item.id,
      ),
    ).toEqual(["r2"]);
  });

  it("looks up a live form by slug", async () => {
    const store = memoryAdapter();
    store.saveForm({
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
    store.saveForm({
      id: "open",
      slug: "open",
      status: "active",
      title: "Open",
      fields: [],
      updatedAt: "2026-01-02T00:00:00.000Z",
    });
    store.saveForm({
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
    store.saveForm({
      id: "intake",
      slug: "intake",
      status: "active",
      title: "Intake",
      fields: [],
    });
    store.create(row);
    await store.delete("r1");
    await store.deleteForm("intake");
    expect(await store.get("r1")).toBeUndefined();
    expect(await store.getForm("intake")).toBeUndefined();
  });

  it("filters responses by formId and status", async () => {
    const store = memoryAdapter();
    store.create(row);
    store.create({
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
});
