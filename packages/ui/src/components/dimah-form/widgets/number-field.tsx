"use client";

import { Input } from "@/components/ui/input";
import { InputGroupInput } from "@/components/ui/input-group";
import { FieldInputGroup } from "@/components/dimah-form/field-input-group";
import { FieldReviewValue } from "@/components/dimah-form/field-review-value";
import { FormFieldFrame } from "@/components/dimah-form/form-field-frame";
import {
  fieldControlProps,
  fieldFlag,
  fieldNumber,
  parseNumberInput,
} from "@/lib/field-attr";
import { readFieldUiMeta } from "@/lib/field-ui-meta";
import type { FieldWidgetProps } from "@/lib/widget-registry";

export function NumberField({ binding, className, mode }: FieldWidgetProps) {
  const field = binding.field;
  if (!field) return null;
  if (mode === "review") {
    return <FieldReviewValue binding={binding} className={className} />;
  }

  const ui = readFieldUiMeta(field);
  const hasAffix = Boolean(ui.prefix || ui.suffix);
  const controlProps = {
    ...fieldControlProps(binding),
    type: "number" as const,
    placeholder: ui.placeholder,
    min: fieldNumber(field, "min"),
    max: fieldNumber(field, "max"),
    step: fieldFlag(field, "integer") ? 1 : undefined,
    value: typeof binding.value === "number" ? binding.value : "",
    onChange: (event: { target: { value: string } }) => {
      binding.onChange(parseNumberInput(event.target.value));
    },
  };

  return (
    <FormFieldFrame binding={binding} className={className}>
      <FieldInputGroup prefix={ui.prefix} suffix={ui.suffix}>
        {hasAffix ? (
          <InputGroupInput {...controlProps} />
        ) : (
          <Input {...controlProps} />
        )}
      </FieldInputGroup>
    </FormFieldFrame>
  );
}
