"use client";

import { emptyToNull } from "@dimah-form/react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FieldControlAffix } from "@/components/dimah-form/field-control-affix";
import { FormFieldFrame } from "@/components/dimah-form/form-field-frame";
import { fieldControlProps, fieldNumber, fieldString } from "@/lib/field-attr";
import { readFieldUiMeta } from "@/lib/field-ui-meta";
import type { FieldWidgetProps } from "@/lib/widget-registry";

export type StringFieldProps = FieldWidgetProps & {
  inputType: "text" | "email" | "date";
};

/** Shared control for `text` / `email` / `date`. Not a registry type. */
export function StringField({
  binding,
  className,
  inputType,
}: StringFieldProps) {
  const field = binding.field;
  if (!field) return null;

  const ui = readFieldUiMeta(field);
  const value = typeof binding.value === "string" ? binding.value : "";
  const placeholder = ui.placeholder;
  const maxLength =
    inputType === "text" ? fieldNumber(field, "maxLength") : undefined;
  const minLength =
    inputType === "text" ? fieldNumber(field, "minLength") : undefined;
  const nearLimit =
    maxLength != null && value.length >= Math.ceil(maxLength * 0.9);
  const controlProps = {
    ...fieldControlProps(binding),
    value,
    placeholder,
    onChange: (event: { target: { value: string } }) => {
      binding.onChange(emptyToNull(event.target.value));
    },
  };

  const count =
    maxLength != null ? (
      <p
        className="text-xs text-end text-dimah-form-muted-foreground tabular-nums"
        aria-live={nearLimit ? "polite" : undefined}
      >
        {value.length}/{maxLength}
      </p>
    ) : null;

  if (inputType === "text" && ui.multiline) {
    return (
      <FormFieldFrame binding={binding} className={className}>
        <Textarea
          {...controlProps}
          rows={ui.rows}
          maxLength={maxLength}
          minLength={minLength}
        />
        {count}
      </FormFieldFrame>
    );
  }

  return (
    <FormFieldFrame binding={binding} className={className}>
      <FieldControlAffix prefix={ui.prefix} suffix={ui.suffix}>
        <Input
          {...controlProps}
          type={inputType}
          min={inputType === "date" ? fieldString(field, "min") : undefined}
          max={inputType === "date" ? fieldString(field, "max") : undefined}
          minLength={minLength}
          maxLength={maxLength}
        />
      </FieldControlAffix>
      {count}
    </FormFieldFrame>
  );
}
