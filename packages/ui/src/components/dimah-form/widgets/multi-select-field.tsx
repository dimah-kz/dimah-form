"use client";

import { fieldOptions } from "@dimah-form/react";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { FormFieldFrame } from "@/components/dimah-form/form-field-frame";
import type { FieldWidgetProps } from "@/lib/widget-registry";

export function MultiSelectField({ binding, className }: FieldWidgetProps) {
  const field = binding.field;
  if (!field) return null;

  const selected = Array.isArray(binding.value)
    ? binding.value.filter((item): item is string => typeof item === "string")
    : [];

  return (
    <FormFieldFrame binding={binding} className={className} layout="group">
      <FieldGroup>
        {fieldOptions(field).map((option) => {
          const id = `${field.id}-${option.value}`;
          return (
            <Field
              key={option.value}
              orientation="horizontal"
              data-disabled={binding.disabled || undefined}
            >
              <Checkbox
                id={id}
                disabled={binding.disabled}
                checked={selected.includes(option.value)}
                onCheckedChange={(checked) =>
                  binding.onChange(
                    checked
                      ? [...selected, option.value]
                      : selected.filter((item) => item !== option.value),
                  )
                }
              />
              <FieldLabel htmlFor={id} className="font-normal">
                {option.label}
              </FieldLabel>
            </Field>
          );
        })}
      </FieldGroup>
    </FormFieldFrame>
  );
}
