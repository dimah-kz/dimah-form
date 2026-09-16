import { describe, expect, it } from "vitest";

import { memoryAdapter } from "./store";

const row = {
  id: "r1",
  formId: "onboarding",
  status: "draft" as const,
  definition: { id: "onboarding", title: "Onboarding", fields: [] },
  answers: {},
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
});
