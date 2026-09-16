import { describe, expect, it } from "vitest";

import { applyPlugins } from "./apply-plugins";
import { createMemoryResponseStore } from "@/store";

describe("applyPlugins", () => {
  it("defaults to an isolated memory store", () => {
    const a = applyPlugins(undefined).store;
    const b = applyPlugins([]).store;
    a.create({
      id: "r1",
      formId: "onboarding",
      status: "draft",
      definition: { id: "onboarding", title: "Onboarding", fields: [] },
      answers: {},
      submittedAt: null,
      createdAt: "t",
      updatedAt: "t",
    });
    expect(b.get("r1")).toBeUndefined();
  });

  it("uses the plugin store when provided", () => {
    const store = createMemoryResponseStore();
    expect(applyPlugins([{ id: "db", store }]).store).toBe(store);
  });

  it("rejects duplicate plugin ids", () => {
    expect(() => applyPlugins([{ id: "db" }, { id: "db" }])).toThrow(
      /Duplicate dimah-form plugin id "db"/,
    );
  });

  it("rejects a second store plugin", () => {
    expect(() =>
      applyPlugins([
        { id: "db", store: createMemoryResponseStore() },
        { id: "other", store: createMemoryResponseStore() },
      ]),
    ).toThrow(/Only one plugin may provide a response store/);
  });
});
