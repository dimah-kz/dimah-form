"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { FieldReviewValue } from "@/components/dimah-form/field-review-value";
import { FormFieldFrame } from "@/components/dimah-form/form-field-frame";
import { fieldControlProps, fieldWidget } from "@/lib/field-attr";
import { booleanOffValue } from "@/lib/field-ui-meta";
import type { FieldWidgetProps } from "@/lib/widget-registry";

export function BooleanField({ binding, className, mode }: FieldWidgetProps) {
  if (!binding.field) return null;
  if (mode === "review") {
    return <FieldReviewValue binding={binding} className={className} />;
  }

  const controlProps = fieldControlProps(binding);
  const checked = binding.value === true;
  const off = booleanOffValue(binding.field);
  const commit = (on: boolean) => {
    binding.onChange(on ? true : off);
  };

  if (fieldWidget(binding.field) === "switch") {
    return (
      <FormFieldFrame binding={binding} className={className} layout="choice">
        <Switch {...controlProps} checked={checked} onCheckedChange={commit} />
      </FormFieldFrame>
    );
  }

  return (
    <FormFieldFrame binding={binding} className={className} layout="choice">
      <Checkbox {...controlProps} checked={checked} onCheckedChange={commit} />
    </FormFieldFrame>
  );
}
