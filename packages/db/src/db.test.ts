import { describe, expect, it } from "vitest";
import { defineForm } from "@dimah-form/core";
import { dimahForm, memoryAdapter } from "@dimah-form/server";

import { db } from "./db";

const onboarding = defineForm({
  title: "Onboarding",
  fields: [{ id: "name", type: "text", required: true }],
});

describe("db adapter", () => {
  it("passes through a ResponseStore", async () => {
    const ids: string[] = [];
    const memory = memoryAdapter();
    const form = dimahForm({
      forms: { onboarding },
      database: db({
        ...memory,
        create(row) {
          ids.push(row.id);
          return memory.create(row);
        },
      }),
    });

    const started = await form.api.startResponse({
      body: { formId: "onboarding" },
    });
    expect(ids).toEqual([started.id]);
    const loaded = await form.api.getResponse({
      query: { responseId: started.id },
    });
    expect(loaded.id).toBe(started.id);
  });
});
