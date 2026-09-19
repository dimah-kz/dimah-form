"use client";

import { Input } from "@/components/ui/input";
import { FieldControlAffix } from "@/components/dimah-form/field-control-affix";
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

  return (
    <FormFieldFrame binding={binding} className={className}>
      <FieldControlAffix prefix={ui.prefix} suffix={ui.suffix}>
        <Input
          {...fieldControlProps(binding)}
          type="number"
          placeholder={ui.placeholder}
          min={fieldNumber(field, "min")}
          max={fieldNumber(field, "max")}
          step={fieldFlag(field, "integer") ? 1 : undefined}
          value={typeof binding.value === "number" ? binding.value : ""}
          onChange={(event) => {
            binding.onChange(parseNumberInput(event.target.value));
          }}
        />
      </FieldControlAffix>
    </FormFieldFrame>
  );
}
