"use client";

import { fieldLabel } from "@dimah-form/react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { RequiredMark } from "@/components/dimah-form/form-field-frame";
import { useFieldIssue } from "@/hooks/use-field-issue";
import type { FieldWidgetProps } from "@/lib/widget-registry";

export function BooleanField({ className, ...binding }: FieldWidgetProps) {
  const issue = useFieldIssue(binding);
  const field = binding.field;
  if (!field) return null;

  const invalid = binding.invalid || Boolean(issue);

  return (
    <Field
      orientation="horizontal"
      className={className}
      data-invalid={invalid || undefined}
      data-disabled={binding.disabled || undefined}
    >
      <Checkbox
        id={field.id}
        disabled={binding.disabled}
        aria-invalid={invalid || undefined}
        aria-required={binding.required || undefined}
        checked={binding.value === true}
        onCheckedChange={(checked) => binding.onChange(checked ? true : null)}
      />
      <FieldContent>
        <FieldLabel htmlFor={field.id} className="font-normal">
          {fieldLabel(field)}
          {binding.required ? <RequiredMark /> : null}
        </FieldLabel>
        <FieldError
          className="[overflow-wrap:anywhere]"
          errors={issue ? [{ message: issue }] : undefined}
        />
      </FieldContent>
    </Field>
  );
}
