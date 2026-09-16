import { describe, expect, it } from "vitest";
import { defineForm } from "@dimah-form/core";
import { dimahForm } from "@dimah-form/server";

import { db } from "./db";

const onboarding = defineForm({
  title: "Onboarding",
  fields: [{ id: "name", type: "text", required: true }],
});

describe("db adapter", () => {
  it("wires the client store so start persists", async () => {
    const ids: string[] = [];
    const rows = new Map<string, unknown>();
    const form = dimahForm({
      forms: { onboarding },
      database: db({
        create(row) {
          ids.push(row.id);
          rows.set(row.id, row);
        },
        get(id) {
          return rows.get(id) as never;
        },
        save(row) {
          rows.set(row.id, row);
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
