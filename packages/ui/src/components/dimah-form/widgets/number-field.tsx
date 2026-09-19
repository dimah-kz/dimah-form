"use client";

import { Input } from "@/components/ui/input";
import { FormFieldFrame } from "@/components/dimah-form/form-field-frame";
import {
  fieldControlProps,
  fieldFlag,
  fieldMetaString,
  fieldNumber,
} from "@/lib/field-attr";
import type { FieldWidgetProps } from "@/lib/widget-registry";

export function NumberField({ binding, className }: FieldWidgetProps) {
  const field = binding.field;
  if (!field) return null;

  return (
    <FormFieldFrame binding={binding} className={className}>
      <Input
        {...fieldControlProps(binding)}
        type="number"
        placeholder={fieldMetaString(field, "placeholder")}
        min={fieldNumber(field, "min")}
        max={fieldNumber(field, "max")}
        step={fieldFlag(field, "integer") ? 1 : undefined}
        value={typeof binding.value === "number" ? binding.value : ""}
        onChange={(event) => {
          binding.onChange(
            event.target.value === "" ? null : Number(event.target.value),
          );
        }}
      />
    </FormFieldFrame>
  );
}
