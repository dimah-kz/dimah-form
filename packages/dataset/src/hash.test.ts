import { describe, expect, it } from "vitest";

import { defineForm, normalizeFormSnapshot } from "@dimah-form/core";

import { canonicalJson, snapshotKey } from "./hash";

const fields = [{ id: "name", type: "text" as const, label: "Name" }];

describe("canonicalJson", () => {
  it("matches RFC 8785 key order and drops undefined members", () => {
    expect(canonicalJson({ b: 1, a: { d: 2, c: 3 } })).toBe(
      '{"a":{"c":3,"d":2},"b":1}',
    );
    expect(canonicalJson({ b: undefined, a: 1 })).toBe('{"a":1}');
  });
});

describe("snapshotKey", () => {
  it("is a 64-char sha-256 hex", async () => {
    const definition = normalizeFormSnapshot({
      id: "contact",
      title: "Contact",
      fields,
    });
    const key = await snapshotKey(definition);
    expect(key).toMatch(/^[0-9a-f]{64}$/);
  });

  it("ignores timestamps, slug, and status", async () => {
    const a = normalizeFormSnapshot({
      id: "contact",
      title: "Contact",
      slug: "a",
      status: "active",
      updatedAt: "2020-01-01T00:00:00.000Z",
      createdAt: "2020-01-01T00:00:00.000Z",
      fields,
    });
    const b = normalizeFormSnapshot({
      id: "contact",
      title: "Contact",
      slug: "b",
      status: "archived",
      updatedAt: "2021-01-01T00:00:00.000Z",
      createdAt: "2021-06-01T00:00:00.000Z",
      fields,
    });
    expect(await snapshotKey(a)).toBe(await snapshotKey(b));
  });

  it("changes when a field label changes", async () => {
    const a = normalizeFormSnapshot({
      id: "contact",
      title: "Contact",
      fields: [{ id: "name", type: "text", label: "Name" }],
    });
    const b = normalizeFormSnapshot({
      id: "contact",
      title: "Contact",
      fields: [{ id: "name", type: "text", label: "Full name" }],
    });
    expect(await snapshotKey(a)).not.toBe(await snapshotKey(b));
  });

  it("is stable for defineForm documents with shuffled keys", async () => {
    const form = defineForm({
      title: "Contact",
      fields: [{ type: "text", id: "name", label: "Name" }],
    });
    const definition = normalizeFormSnapshot({ id: "contact", ...form });
    const again = normalizeFormSnapshot({ id: "contact", ...form });
    expect(await snapshotKey(definition)).toBe(await snapshotKey(again));
  });
});
