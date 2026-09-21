import { describe, expect, it } from "vitest";

import { createDatasetReader } from "./reader";
import { DATASET_SPEC, emptyCodebook, type DatasetPage } from "./spec";

describe("createDatasetReader", () => {
  it("walks nextOffset and merges page codebooks", async () => {
    const pages: DatasetPage[] = [
      {
        spec: DATASET_SPEC,
        records: [
          {
            spec: DATASET_SPEC,
            id: "r1",
            formId: "contact",
            status: "submitted",
            submittedAt: "2026-06-01T00:00:00.000Z",
            createdAt: "2026-06-01T00:00:00.000Z",
            snapshotKey: "aa",
            fields: [
              { id: "name", type: "text", value: "Ada", formatted: "Ada" },
            ],
          },
        ],
        codebook: {
          spec: DATASET_SPEC,
          snapshots: [
            { key: "aa", n: 1, lastSeenAt: "2026-06-01T00:00:00.000Z" },
          ],
          fields: [
            {
              id: "name",
              type: "text",
              label: "Full name",
              inSnapshots: ["aa"],
            },
          ],
        },
        limit: 1,
        offset: 0,
        nextOffset: 1,
      },
      {
        spec: DATASET_SPEC,
        records: [
          {
            spec: DATASET_SPEC,
            id: "r0",
            formId: "contact",
            status: "submitted",
            submittedAt: "2026-01-01T00:00:00.000Z",
            createdAt: "2026-01-01T00:00:00.000Z",
            snapshotKey: "bb",
            fields: [
              { id: "name", type: "text", value: "Bob", formatted: "Bob" },
            ],
          },
        ],
        codebook: {
          spec: DATASET_SPEC,
          snapshots: [
            { key: "bb", n: 1, lastSeenAt: "2026-01-01T00:00:00.000Z" },
          ],
          fields: [
            { id: "name", type: "text", label: "Name", inSnapshots: ["bb"] },
          ],
        },
        limit: 1,
        offset: 1,
        nextOffset: null,
      },
    ];
    const reader = createDatasetReader({
      page: async ({ offset = 0 }) => pages[offset] ?? pages[1],
    });
    const result = await reader.readAll();
    expect(result.records.map((record) => record.id)).toEqual(["r1", "r0"]);
    expect(result.codebook.fields[0]?.label).toBe("Full name");
    expect(result.codebook.snapshots).toHaveLength(2);
  });

  it("honors AbortSignal", async () => {
    const controller = new AbortController();
    controller.abort();
    const reader = createDatasetReader({
      page: async () => ({
        spec: DATASET_SPEC,
        records: [],
        codebook: emptyCodebook(),
        limit: 50,
        offset: 0,
        nextOffset: null,
      }),
      signal: controller.signal,
    });
    await expect(reader.readAll()).rejects.toThrow();
  });
});
