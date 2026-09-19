import { describe, expect, it } from "vitest";
import type { FormField } from "@dimah-form/react";

import {
  booleanOffValue,
  fieldsUseHalfWidth,
  fieldWidthClass,
  readFieldUiMeta,
  readFormUiMeta,
  readOptionUiMeta,
  type FormDefinitionUi,
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
          autocomplete: "name",
          inputMode: "text",
          prefix: "@",
          suffix: "kg",
          width: "half",
          orientation: "horizontal",
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
      autocomplete: "name",
      inputMode: "text",
      prefix: "@",
      suffix: "kg",
      width: "half",
      orientation: "horizontal",
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
  it("reads option description, form layout, and step titles", () => {
    expect(
      readOptionUiMeta({ meta: { description: " Ships in 2 days " } }),
    ).toEqual({ description: "Ships in 2 days" });
    expect(
      readFormUiMeta({
        meta: {
          layout: "steps",
          submitLabel: "Send",
          steps: { "1": " About ", "2": "  " },
        },
      }),
    ).toEqual({
      layout: "steps",
      submitLabel: "Send",
      steps: { "1": "About" },
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
      booleanOffValue(field({ id: "ok", type: "boolean", unsetOnOff: true })),
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

describe("FormDefinitionUi", () => {
  it("accepts UI meta and type-specific field keys", () => {
    const form = {
      title: "X",
      meta: { layout: "steps", steps: { "1": "About" } },
      fields: [
        {
          id: "name",
          type: "text",
          minLength: 2,
          meta: { placeholder: "Ada", width: "half" },
        },
        {
          id: "ok",
          type: "boolean",
          unsetOnOff: true,
          meta: { widget: "switch" },
        },
        { id: "file", type: "file", accept: ".pdf" },
      ],
    } satisfies FormDefinitionUi;
    expect(form.fields[0]?.meta?.placeholder).toBe("Ada");
    expect(form.meta?.steps?.["1"]).toBe("About");
  });

  it("rejects unknown field meta keys", () => {
    const form = {
      title: "X",
      fields: [
        {
          id: "n",
          type: "text",
          meta: {
            // @ts-expect-error unknown UI meta key
            placeholer: "Ada",
          },
        },
      ],
    } satisfies FormDefinitionUi;
    expect(form.fields[0]?.id).toBe("n");
  });
});
