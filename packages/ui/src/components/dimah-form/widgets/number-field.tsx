"use client";

import { Input } from "@/components/ui/input";
import { FormFieldFrame } from "@/components/dimah-form/form-field-frame";
import { fieldFlag, fieldNumber } from "@/lib/field-attr";
import type { FieldWidgetProps } from "@/lib/widget-registry";

export function NumberField({ className, ...binding }: FieldWidgetProps) {
  const field = binding.field;
  if (!field) return null;

  return (
    <FormFieldFrame binding={binding} className={className}>
      <Input
        id={field.id}
        name={field.id}
        type="number"
        disabled={binding.disabled}
        aria-invalid={binding.invalid || undefined}
        aria-required={binding.required || undefined}
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
