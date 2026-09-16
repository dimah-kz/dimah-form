import { describe, expect, it } from "vitest";

import { memoryAdapter } from "./store";

const row = {
  id: "r1",
  formId: "onboarding",
  status: "draft" as const,
  definition: { id: "onboarding", title: "Onboarding", fields: [] },
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
      title: "Intake",
      fields: [{ id: "n", type: "text" }],
    });
    store.create({
      ...row,
      formId: "intake",
      definition: {
        id: "intake",
        title: "Old",
        fields: [{ id: "n", type: "text" }],
      },
    });
    expect((await store.getForm("intake"))?.title).toBe("Intake");
    expect(await store.listForms()).toHaveLength(1);
  });
});
