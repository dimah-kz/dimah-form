"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { FormFieldFrame } from "@/components/dimah-form/form-field-frame";
import { fieldControlProps } from "@/lib/field-attr";
import type { FieldWidgetProps } from "@/lib/widget-registry";

export function BooleanField({ binding, className }: FieldWidgetProps) {
  if (!binding.field) return null;

  return (
    <FormFieldFrame binding={binding} className={className} layout="choice">
      <Checkbox
        {...fieldControlProps(binding)}
        checked={binding.value === true}
        onCheckedChange={(checked) => binding.onChange(checked ? true : null)}
      />
    </FormFieldFrame>
  );
}
