"use client";

import { emptyToNull } from "@dimah-form/react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormFieldFrame } from "@/components/dimah-form/form-field-frame";
import { fieldMetaFlag, fieldString } from "@/lib/field-attr";
import type { FieldWidgetProps } from "@/lib/widget-registry";

export type StringFieldProps = FieldWidgetProps & {
  inputType: "text" | "email" | "date";
};

/** Shared control for `text` / `email` / `date`. Not a registry type. */
export function StringField({
  inputType,
  className,
  ...binding
}: StringFieldProps) {
  const field = binding.field;
  if (!field) return null;

  const invalid = binding.invalid;
  const value = typeof binding.value === "string" ? binding.value : "";
  const controlProps = {
    id: field.id,
    name: field.id,
    disabled: binding.disabled,
    "aria-invalid": invalid || undefined,
    "aria-required": binding.required || undefined,
    value,
    onChange: (event: { target: { value: string } }) => {
      binding.onChange(emptyToNull(event.target.value));
    },
  };

  if (inputType === "text" && fieldMetaFlag(field, "multiline")) {
    return (
      <FormFieldFrame binding={binding} className={className}>
        <Textarea {...controlProps} />
      </FormFieldFrame>
    );
  }

  return (
    <FormFieldFrame binding={binding} className={className}>
      <Input
        {...controlProps}
        type={inputType}
        min={inputType === "date" ? fieldString(field, "min") : undefined}
        max={inputType === "date" ? fieldString(field, "max") : undefined}
      />
    </FormFieldFrame>
  );
}
