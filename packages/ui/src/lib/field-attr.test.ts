import { describe, expect, it } from "vitest";
import type { FormField, FormFieldBinding } from "@dimah-form/react";

import {
  fieldControlProps,
  fieldDescriptionId,
  fieldErrorId,
  fieldHelpId,
  fieldMetaNumber,
  fieldMetaString,
  fieldWidget,
  parseNumberInput,
} from "@/lib/field-attr";

function field(
  over: Partial<FormField> & Pick<FormField, "id" | "type">,
): FormField {
  return over;
}

function binding(
  over: Partial<FormFieldBinding> & { field: FormField },
): FormFieldBinding {
  return {
    id: over.field.id,
    value: undefined,
    error: undefined,
    errorCode: undefined,
    errorParams: undefined,
    invalid: false,
    required: false,
    disabled: false,
    visible: true,
    onChange: () => undefined,
    ...over,
  };
}

describe("field meta helpers", () => {
  it("reads trimmed strings and finite numbers from meta", () => {
    const item = field({
      id: "name",
      type: "text",
      meta: { placeholder: "  Ada  ", step: 2, widget: "radio" },
    });
    expect(fieldMetaString(item, "placeholder")).toBe("Ada");
    expect(fieldMetaNumber(item, "step")).toBe(2);
    expect(fieldWidget(item)).toBe("radio");
  });

  it("ignores blank widget strings", () => {
    expect(
      fieldWidget(field({ id: "n", type: "text", meta: { widget: "  " } })),
    ).toBeUndefined();
  });
});

describe("fieldControlProps", () => {
  it("sets describedby for a description and an issue", () => {
    const item = field({
      id: "email",
      type: "email",
      description: "Work email",
    });
    const props = fieldControlProps(binding({ field: item, invalid: true }));
    expect(props["aria-describedby"]).toBe(
      `${fieldDescriptionId("email")} ${fieldErrorId("email")}`,
    );
    expect(props["aria-invalid"]).toBe(true);
  });

  it("adds autocomplete and email inputMode", () => {
    const email = fieldControlProps(
      binding({
        field: field({
          id: "email",
          type: "email",
          meta: { autocomplete: "username" },
        }),
      }),
    );
    expect(email.autoComplete).toBe("username");
    expect(email.inputMode).toBe("email");
  });

  it("omits describedby when there is nothing to point at", () => {
    const props = fieldControlProps(
      binding({ field: field({ id: "n", type: "text" }) }),
    );
    expect(props["aria-describedby"]).toBeUndefined();
  });

  it("includes help in describedby", () => {
    const props = fieldControlProps(
      binding({
        field: field({
          id: "hours",
          type: "number",
          meta: { help: "0–40" },
        }),
      }),
    );
    expect(props["aria-describedby"]).toBe(fieldHelpId("hours"));
  });
});

describe("parseNumberInput", () => {
  it("nulls empty and non-finite values", () => {
    expect(parseNumberInput("")).toBeNull();
    expect(parseNumberInput("  ")).toBeNull();
    expect(parseNumberInput("1e")).toBeNull();
    expect(parseNumberInput("12.5")).toBe(12.5);
  });
});
