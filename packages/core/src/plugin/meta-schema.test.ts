import { describe, expect, it } from "vitest";

import { assertMetaNamespace, metaSchemaTarget } from "./meta-schema";

describe("metaSchemaTarget", () => {
  it("uses the whole bag when namespace is omitted", () => {
    expect(metaSchemaTarget({ locale: "en" }, undefined)).toEqual({
      present: true,
      value: { locale: "en" },
    });
    expect(metaSchemaTarget(undefined, undefined)).toEqual({
      present: true,
      value: {},
    });
  });

  it("skips a namespaced schema when the key is absent", () => {
    expect(metaSchemaTarget({ locale: "en" }, "scoring")).toEqual({
      present: false,
    });
    expect(metaSchemaTarget(undefined, "scoring")).toEqual({ present: false });
    expect(metaSchemaTarget(null, "scoring")).toEqual({ present: false });
  });

  it("reads the nested value when the namespace key is present", () => {
    expect(
      metaSchemaTarget({ scoring: { variables: ["gad7"] } }, "scoring"),
    ).toEqual({
      present: true,
      value: { variables: ["gad7"] },
    });
    expect(metaSchemaTarget({ scoring: undefined }, "scoring")).toEqual({
      present: true,
      value: undefined,
    });
  });
});

describe("assertMetaNamespace", () => {
  it("trims a non-empty namespace", () => {
    expect(assertMetaNamespace("  scoring  ", "quiz", "plugin")).toBe(
      "scoring",
    );
  });

  it("rejects an empty namespace", () => {
    expect(() => assertMetaNamespace("  ", "quiz", "plugin")).toThrow(
      /metaNamespace must be a non-empty string/,
    );
  });
});
