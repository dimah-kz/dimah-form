import type { ResponseRecord } from "@dimah-form/core";
import { describe, expect, it } from "vitest";

import { memoryAdapter } from "@/store";

import { walkFullResponses } from "./walk-responses";

const definition = {
  id: "plain",
  slug: "plain",
  status: "active" as const,
  title: "Plain",
  fields: [{ id: "name", type: "text", required: true }],
};

function record(id: string, name: string): ResponseRecord {
  return {
    id,
    formId: "plain",
    status: "submitted",
    definition,
    answers: { name },
    respondentId: null,
    submittedAt: "2026-01-15T00:00:00.000Z",
    createdAt: "2026-01-15T00:00:00.000Z",
    updatedAt: "2026-01-15T00:00:00.000Z",
  };
}

describe("walkFullResponses", () => {
  it("visits every full row and reports scanned", async () => {
    const store = memoryAdapter();
    await store.createResponse(record("r1", "Ada"));
    await store.createResponse(record("r2", "Bob"));
    await store.createResponse(record("r3", "Cyd"));
    const ids: string[] = [];
    const result = await walkFullResponses(
      (query) => store.listResponses(query),
      { formId: "plain" },
      {
        visit: (row) => {
          ids.push(row.id);
        },
      },
    );
    expect(ids).toHaveLength(3);
    expect(result).toEqual({ scanned: 3, truncated: false });
  });

  it("stops at maxRows and sets truncated when more rows remain", async () => {
    const store = memoryAdapter();
    await store.createResponse(record("r1", "Ada"));
    await store.createResponse(record("r2", "Bob"));
    await store.createResponse(record("r3", "Cyd"));
    const ids: string[] = [];
    const result = await walkFullResponses(
      (query) => store.listResponses(query),
      { formId: "plain" },
      {
        maxRows: 2,
        visit: (row) => {
          ids.push(row.id);
        },
      },
    );
    expect(ids).toHaveLength(2);
    expect(result).toEqual({ scanned: 2, truncated: true });
  });

  it("honors AbortSignal", async () => {
    const store = memoryAdapter();
    await store.createResponse(record("r1", "Ada"));
    const signal = AbortSignal.abort();
    await expect(
      walkFullResponses(
        (query) => store.listResponses(query),
        { formId: "plain" },
        {
          signal,
          visit: () => undefined,
        },
      ),
    ).rejects.toThrow();
  });
});
