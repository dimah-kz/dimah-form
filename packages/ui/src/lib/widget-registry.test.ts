import { describe, expect, it } from "vitest";

import { UnknownField } from "@/components/dimah-form/widgets/unknown-field";
import { mergeFieldWidgets, resolveFieldWidget } from "@/lib/widget-registry";

function WidgetA() {
  return null;
}

function WidgetB() {
  return null;
}

function WidgetC() {
  return null;
}

describe("mergeFieldWidgets", () => {
  it("lets later layers win", () => {
    const merged = mergeFieldWidgets(
      { text: WidgetA, email: WidgetA },
      undefined,
      { text: WidgetB },
      { number: WidgetC },
    );

    expect(merged.text).toBe(WidgetB);
    expect(merged.email).toBe(WidgetA);
    expect(merged.number).toBe(WidgetC);
  });
});

describe("resolveFieldWidget", () => {
  it("returns the registered widget", () => {
    expect(resolveFieldWidget("text", { text: WidgetA })).toBe(WidgetA);
  });

  it("falls back when the type is missing", () => {
    expect(resolveFieldWidget("rating", { text: WidgetA })).toBe(UnknownField);
  });
});
