import { describe, expect, it } from "vitest";
import {
  defineFieldType,
  type FormField,
  type NamespacedMeta,
} from "@dimah-form/react";

import {
  booleanOffValue,
  fieldsUseGrid,
  fieldWidthClass,
  isFieldUiWidget,
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
          help: "  Shown under the control  ",
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
      help: "Shown under the control",
    });
  });

  it("drops invalid width and orientation", () => {
    const meta = readFieldUiMeta(
      field({
        id: "n",
        type: "text",
        meta: { width: "quarter", orientation: "diagonal" },
      }),
    );
    expect(meta.width).toBeUndefined();
    expect(meta.orientation).toBeUndefined();
  });
});

describe("isFieldUiWidget", () => {
  it("matches built-in presentation variants only", () => {
    expect(isFieldUiWidget("radio")).toBe(true);
    expect(isFieldUiWidget("switch")).toBe(true);
    expect(isFieldUiWidget("chips")).toBe(true);
    expect(isFieldUiWidget("text.mask")).toBe(false);
    expect(isFieldUiWidget(undefined)).toBe(false);
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
    const third = field({
      id: "c",
      type: "text",
      meta: { width: "third" },
    });
    expect(fieldsUseGrid([full])).toBe(false);
    expect(fieldsUseGrid([full, half])).toBe(true);
    expect(fieldsUseGrid([third])).toBe(true);
    expect(fieldWidthClass(full, false)).toBeUndefined();
    expect(fieldWidthClass(full, true)).toBe(
      "@min-[32rem]/field-group:col-span-6",
    );
    expect(fieldWidthClass(half, true)).toBe(
      "@min-[32rem]/field-group:col-span-3",
    );
    expect(fieldWidthClass(third, true)).toBe(
      "@min-[32rem]/field-group:col-span-2",
    );
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
      ],
    } satisfies FormDefinitionUi;
    expect(form.fields[0]?.meta?.placeholder).toBe("Ada");
    expect(form.meta?.steps?.["1"]).toBe("About");
  });

  it("allows extra field meta keys next to known UI keys", () => {
    const form = {
      title: "X",
      fields: [
        {
          id: "n",
          type: "text",
          meta: {
            placeholder: "Ada",
            icon: "user",
          },
        },
      ],
    } satisfies FormDefinitionUi;
    expect(form.fields[0]?.meta?.icon).toBe("user");
  });

  it("types custom fieldSchema keys when field types are passed", () => {
    const rating = defineFieldType({
      type: "rating",
      validate: () => undefined,
      $Infer: 0 as number,
    });
    expect(rating.type).toBe("rating");
    const form = {
      title: "X",
      fields: [
        {
          id: "score",
          type: "rating",
          max: 5,
          meta: { help: "1–5" },
        },
      ],
    } satisfies FormDefinitionUi<readonly [typeof rating]>;
    expect(form.fields[0]?.type).toBe("rating");
  });

  it("merges plugin $Meta keys next to UI meta", () => {
    const scoring = {
      id: "scoring",
      $Meta: {} as NamespacedMeta<"scoring", { form: { variables: string[] } }>,
    };
    expect(scoring.id).toBe("scoring");
    const form = {
      title: "X",
      meta: {
        layout: "steps",
        scoring: { variables: ["gad7"] },
      },
      fields: [{ id: "n", type: "text", meta: { placeholder: "Ada" } }],
    } satisfies FormDefinitionUi<[], readonly [typeof scoring]>;
    expect(form.meta.scoring?.variables).toEqual(["gad7"]);
    expect(form.meta.layout).toBe("steps");
    ({
      title: "X",
      fields: [{ id: "n", type: "text" }],
      // @ts-expect-error scoring.variables must be string[]
      meta: { scoring: { variables: 1 } },
    }) satisfies FormDefinitionUi<[], readonly [typeof scoring]>;
  });
});
