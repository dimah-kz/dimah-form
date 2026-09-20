import { describe, expect, it } from "vitest";

import {
  mergeFieldWidgets,
  resolveFieldWidget,
  sameFieldWidgets,
} from "@/lib/widget-registry";

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

  it("returns undefined when the type is missing", () => {
    expect(resolveFieldWidget("rating", { text: WidgetA })).toBeUndefined();
    expect(resolveFieldWidget(undefined, { text: WidgetA })).toBeUndefined();
  });

  it("prefers a registered meta.widget over field.type", () => {
    const field = {
      id: "phone",
      type: "text",
      meta: { widget: "text.mask" },
    };
    expect(
      resolveFieldWidget(field, { text: WidgetA, "text.mask": WidgetB }),
    ).toBe(WidgetB);
    expect(resolveFieldWidget(field, { text: WidgetA })).toBe(WidgetA);
  });

  it("keeps radio / switch / chips on the type widget", () => {
    const select = {
      id: "role",
      type: "select",
      meta: { widget: "radio" },
    };
    expect(
      resolveFieldWidget(select, { select: WidgetA, radio: WidgetB }),
    ).toBe(WidgetA);
    expect(
      resolveFieldWidget(
        { id: "ok", type: "boolean", meta: { widget: "switch" } },
        { boolean: WidgetA, switch: WidgetB },
      ),
    ).toBe(WidgetA);
    expect(
      resolveFieldWidget(
        { id: "tags", type: "multiSelect", meta: { widget: "chips" } },
        { multiSelect: WidgetA, chips: WidgetB },
      ),
    ).toBe(WidgetA);
  });
});

describe("sameFieldWidgets", () => {
  it("treats matching component identity as equal", () => {
    expect(
      sameFieldWidgets(
        { text: WidgetA, rating: WidgetB },
        { text: WidgetA, rating: WidgetB },
      ),
    ).toBe(true);
  });

  it("detects a replaced widget", () => {
    expect(sameFieldWidgets({ text: WidgetA }, { text: WidgetB })).toBe(false);
  });
});
