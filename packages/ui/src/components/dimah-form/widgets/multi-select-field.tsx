"use client";

import { fieldLabel, fieldOptions } from "@dimah-form/react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { RequiredMark } from "@/components/dimah-form/form-field-frame";
import { useFieldIssue } from "@/hooks/use-field-issue";
import type { FieldWidgetProps } from "@/lib/widget-registry";

export function MultiSelectField({ className, ...binding }: FieldWidgetProps) {
  const issue = useFieldIssue(binding);
  const field = binding.field;
  if (!field) return null;

  const invalid = binding.invalid || Boolean(issue);
  const selected = Array.isArray(binding.value)
    ? binding.value.filter((item): item is string => typeof item === "string")
    : [];

  return (
    <FieldSet
      className={className}
      data-invalid={invalid || undefined}
      data-disabled={binding.disabled || undefined}
    >
      <FieldLegend variant="label">
        {fieldLabel(field)}
        {binding.required ? <RequiredMark /> : null}
      </FieldLegend>
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
      {typeof field.description === "string" ? (
        <FieldDescription>{field.description}</FieldDescription>
      ) : null}
      <FieldError
        className="[overflow-wrap:anywhere]"
        errors={issue ? [{ message: issue }] : undefined}
      />
    </FieldSet>
  );
}
