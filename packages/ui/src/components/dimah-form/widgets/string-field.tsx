"use client";

import { emptyToNull } from "@dimah-form/react";
import { FieldDescription } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  InputGroupInput,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import { Textarea } from "@/components/ui/textarea";
import { FieldInputGroup } from "@/components/dimah-form/field-input-group";
import { FieldReviewValue } from "@/components/dimah-form/field-review-value";
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
  mode,
  inputType,
}: StringFieldProps) {
  const field = binding.field;
  if (!field) return null;
  if (mode === "review") {
    return <FieldReviewValue binding={binding} className={className} />;
  }

  const ui = readFieldUiMeta(field);
  const value = typeof binding.value === "string" ? binding.value : "";
  const placeholder = ui.placeholder;
  const maxLength =
    inputType === "text" ? fieldNumber(field, "maxLength") : undefined;
  const minLength =
    inputType === "text" ? fieldNumber(field, "minLength") : undefined;
  const nearLimit =
    maxLength != null && value.length >= Math.ceil(maxLength * 0.9);
  const hasAffix = Boolean(ui.prefix || ui.suffix);
  const useGroup = hasAffix || maxLength != null;
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
      <span aria-live={nearLimit ? "polite" : undefined}>
        {value.length}/{maxLength}
      </span>
    ) : null;
  const groupedCount = hasAffix ? undefined : count;
  const trailingCount = hasAffix ? count : null;

  if (inputType === "text" && ui.multiline) {
    const textarea = useGroup ? (
      <InputGroupTextarea
        {...controlProps}
        rows={ui.rows}
        maxLength={maxLength}
        minLength={minLength}
      />
    ) : (
      <Textarea
        {...controlProps}
        rows={ui.rows}
        maxLength={maxLength}
        minLength={minLength}
      />
    );

    return (
      <FormFieldFrame binding={binding} className={className}>
        <FieldInputGroup
          prefix={ui.prefix}
          suffix={ui.suffix}
          count={groupedCount}
        >
          {textarea}
        </FieldInputGroup>
        {trailingCount ? (
          <FieldDescription className="text-end text-dimah-form-muted-foreground tabular-nums">
            {trailingCount}
          </FieldDescription>
        ) : null}
      </FormFieldFrame>
    );
  }

  const input = useGroup ? (
    <InputGroupInput
      {...controlProps}
      type={inputType}
      min={inputType === "date" ? fieldString(field, "min") : undefined}
      max={inputType === "date" ? fieldString(field, "max") : undefined}
      minLength={minLength}
      maxLength={maxLength}
    />
  ) : (
    <Input
      {...controlProps}
      type={inputType}
      min={inputType === "date" ? fieldString(field, "min") : undefined}
      max={inputType === "date" ? fieldString(field, "max") : undefined}
      minLength={minLength}
      maxLength={maxLength}
    />
  );

  return (
    <FormFieldFrame binding={binding} className={className}>
      <FieldInputGroup
        prefix={ui.prefix}
        suffix={ui.suffix}
        count={groupedCount}
      >
        {input}
      </FieldInputGroup>
      {trailingCount ? (
        <FieldDescription className="text-end text-dimah-form-muted-foreground tabular-nums">
          {trailingCount}
        </FieldDescription>
      ) : null}
    </FormFieldFrame>
  );
}
