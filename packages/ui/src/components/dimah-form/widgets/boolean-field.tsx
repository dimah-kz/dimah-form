"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { FormFieldFrame } from "@/components/dimah-form/form-field-frame";
import { fieldControlProps, fieldWidget } from "@/lib/field-attr";
import type { FieldWidgetProps } from "@/lib/widget-registry";

export function BooleanField({ binding, className }: FieldWidgetProps) {
  if (!binding.field) return null;

  const controlProps = fieldControlProps(binding);
  const checked = binding.value === true;

  if (fieldWidget(binding.field) === "switch") {
    return (
      <FormFieldFrame binding={binding} className={className} layout="choice">
        <Switch
          {...controlProps}
          checked={checked}
          onCheckedChange={(next) => binding.onChange(next ? true : null)}
        />
      </FormFieldFrame>
    );
  }

  return (
    <FormFieldFrame binding={binding} className={className} layout="choice">
      <Checkbox
        {...controlProps}
        checked={checked}
        onCheckedChange={(next) => binding.onChange(next ? true : null)}
      />
    </FormFieldFrame>
  );
}
