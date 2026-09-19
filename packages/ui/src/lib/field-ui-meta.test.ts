import { describe, expect, it } from "vitest";
import type { FormField } from "@dimah-form/react";

import {
  booleanOffValue,
  fieldsUseHalfWidth,
  fieldWidthClass,
  readFieldUiMeta,
  readFormUiMeta,
  readOptionUiMeta,
} from "@/lib/field-ui-meta";

function field(
  over: Partial<FormField> & Pick<FormField, "id" | "type">,
): FormField {
  return over;
}

describe("readFieldUiMeta", () => {
  it("reads known keys and ignores junk", () => {
    const meta = readFieldUiMeta(
      field({
        id: "name",
        type: "text",
        meta: {
          widget: "radio",
          placeholder: "  Ada  ",
          multiline: true,
          rows: 4,
          section: "About",
          step: 2,
          stepTitle: "Profile",
          autocomplete: "name",
          inputMode: "text",
          prefix: "@",
          suffix: "kg",
          width: "half",
          orientation: "horizontal",
          help: "Shown on your badge",
          unsetOnOff: true,
          extra: "ok",
        },
      }),
    );
    expect(meta).toEqual({
      widget: "radio",
      placeholder: "Ada",
      multiline: true,
      rows: 4,
      section: "About",
      step: 2,
      stepTitle: "Profile",
      autocomplete: "name",
      inputMode: "text",
      prefix: "@",
      suffix: "kg",
      width: "half",
      orientation: "horizontal",
      help: "Shown on your badge",
      unsetOnOff: true,
    });
  });

  it("drops invalid width and orientation", () => {
    const meta = readFieldUiMeta(
      field({
        id: "n",
        type: "text",
        meta: { width: "third", orientation: "diagonal" },
      }),
    );
    expect(meta.width).toBeUndefined();
    expect(meta.orientation).toBeUndefined();
  });
});

describe("readOptionUiMeta / readFormUiMeta", () => {
  it("reads option description and form layout", () => {
    expect(
      readOptionUiMeta({ meta: { description: " Ships in 2 days " } }),
    ).toEqual({ description: "Ships in 2 days" });
    expect(
      readFormUiMeta({ meta: { layout: "steps", submitLabel: "Send" } }),
    ).toEqual({
      layout: "steps",
      submitLabel: "Send",
    });
    expect(
      readFormUiMeta({ meta: { layout: "wizard" } }).layout,
    ).toBeUndefined();
  });
});

describe("booleanOffValue", () => {
  it("defaults to false and nulls when unsetOnOff", () => {
    expect(booleanOffValue(field({ id: "ok", type: "boolean" }))).toBe(false);
    expect(
      booleanOffValue(
        field({ id: "ok", type: "boolean", meta: { unsetOnOff: true } }),
      ),
    ).toBeNull();
  });
});

describe("field width helpers", () => {
  it("only spans when the group is a grid", () => {
    const full = field({ id: "a", type: "text" });
    const half = field({
      id: "b",
      type: "text",
      meta: { width: "half" },
    });
    expect(fieldsUseHalfWidth([full])).toBe(false);
    expect(fieldsUseHalfWidth([full, half])).toBe(true);
    expect(fieldWidthClass(full, false)).toBeUndefined();
    expect(fieldWidthClass(full, true)).toBe(
      "@min-[32rem]/field-group:col-span-2",
    );
    expect(fieldWidthClass(half, true)).toBeUndefined();
  });
});
