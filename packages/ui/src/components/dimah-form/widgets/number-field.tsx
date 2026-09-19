"use client";

import { Input } from "@/components/ui/input";
import { FieldControlAffix } from "@/components/dimah-form/field-control-affix";
import { FormFieldFrame } from "@/components/dimah-form/form-field-frame";
import { fieldControlProps, fieldFlag, fieldNumber } from "@/lib/field-attr";
import { readFieldUiMeta } from "@/lib/field-ui-meta";
import type { FieldWidgetProps } from "@/lib/widget-registry";

export function NumberField({ binding, className }: FieldWidgetProps) {
  const field = binding.field;
  if (!field) return null;

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
            binding.onChange(
              event.target.value === "" ? null : Number(event.target.value),
            );
          }}
        />
      </FieldControlAffix>
    </FormFieldFrame>
  );
}
