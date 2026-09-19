"use client";

import { createElement, type ReactNode } from "react";
import { fieldLabel, type FormFieldBinding } from "@dimah-form/react";
import { cn } from "cn";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { useFieldIssue } from "@/hooks/use-field-issue";
import {
  resolveFieldWidget,
  type FieldWidgetRegistry,
} from "@/lib/widget-registry";

export type FormFieldProps<TValue = unknown> = {
  binding: FormFieldBinding<TValue>;
  widgets?: FieldWidgetRegistry;
  /** Replace the type widget with a custom control. */
  children?: ReactNode;
  className?: string;
  orientation?: "vertical" | "horizontal";
};

/**
 * Label / description / issue chrome around one `form.field(id)` binding.
 * The control is `children`, or the widget registered for `field.type`.
 */
export function FormField<TValue = unknown>({
  binding,
  widgets,
  children,
  className,
  orientation = "vertical",
}: FormFieldProps<TValue>) {
  const issue = useFieldIssue(binding);
  const field = binding.field;
  if (!binding.visible || !field) return null;

  const invalid = binding.invalid || Boolean(issue);

  return (
    <Field
      className={cn(className)}
      orientation={orientation}
      data-invalid={invalid || undefined}
      data-disabled={binding.disabled || undefined}
    >
      <FieldLabel htmlFor={field.id}>
        {fieldLabel(field)}
        {binding.required ? (
          <span className="ms-1 text-dimah-form-destructive" aria-hidden>
            *
          </span>
        ) : null}
      </FieldLabel>
      {children ??
        createElement(resolveFieldWidget(field.type, widgets), binding)}
      {typeof field.description === "string" ? (
        <FieldDescription>{field.description}</FieldDescription>
      ) : null}
      <FieldError errors={issue ? [{ message: issue }] : undefined} />
    </Field>
  );
}
