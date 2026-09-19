"use client";

import type { ReactNode } from "react";
import { fieldLabel, type FormFieldBinding } from "@dimah-form/react";
import { cn } from "cn";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { useFieldIssue } from "@/hooks/use-field-issue";

export function RequiredMark() {
  return (
    <span className="ms-1 text-dimah-form-destructive" aria-hidden>
      *
    </span>
  );
}

export type FormFieldFrameProps<TValue = unknown> = {
  binding: FormFieldBinding<TValue>;
  children?: ReactNode;
  className?: string;
  orientation?: "vertical" | "horizontal" | "responsive";
  /** `false` hides. Omit for `field.label` (or the field id). */
  label?: ReactNode | false;
  /** `false` hides. Omit for `field.description` when it is a string. */
  description?: ReactNode | false;
  /** `false` hides. Omit for the localized session issue. */
  error?: ReactNode | false;
  /** Visual asterisk when `binding.required`. Default `true`. */
  requiredIndicator?: boolean;
};

/**
 * Default shadcn `Field` chrome (label / description / issue) around a control.
 * Type widgets that need different anatomy (`boolean`, `multiSelect`) skip this.
 */
export function FormFieldFrame<TValue = unknown>({
  binding,
  children,
  className,
  orientation = "vertical",
  label,
  description,
  error,
  requiredIndicator = true,
}: FormFieldFrameProps<TValue>) {
  const issue = useFieldIssue(binding);
  const field = binding.field;
  if (!field) return null;

  const invalid = binding.invalid || Boolean(issue);
  const labelContent = label === false ? null : (label ?? fieldLabel(field));
  const descriptionContent =
    description === false
      ? null
      : (description ??
        (typeof field.description === "string" ? field.description : null));
  const errorContent = error === false ? null : (error ?? issue ?? null);

  return (
    <Field
      className={cn(className)}
      orientation={orientation}
      data-invalid={invalid || undefined}
      data-disabled={binding.disabled || undefined}
    >
      {labelContent ? (
        <FieldLabel htmlFor={field.id}>
          {labelContent}
          {requiredIndicator && binding.required ? <RequiredMark /> : null}
        </FieldLabel>
      ) : null}
      {children}
      {descriptionContent ? (
        <FieldDescription>{descriptionContent}</FieldDescription>
      ) : null}
      {errorContent ? (
        <FieldError
          className="[overflow-wrap:anywhere]"
          errors={
            typeof errorContent === "string"
              ? [{ message: errorContent }]
              : undefined
          }
        >
          {typeof errorContent === "string" ? undefined : errorContent}
        </FieldError>
      ) : null}
    </Field>
  );
}
