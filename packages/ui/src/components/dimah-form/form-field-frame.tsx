"use client";

import type { ReactNode } from "react";
import { fieldLabel, type FormFieldBinding } from "@dimah-form/react";
import { cn } from "cn";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { useFieldIssue } from "@/hooks/use-field-issue";

export function RequiredMark() {
  return (
    <span className="ms-1 text-dimah-form-destructive" aria-hidden>
      *
    </span>
  );
}

export type FormFieldFrameLayout = "stack" | "choice" | "group";

export type FormFieldFrameProps<TValue = unknown> = {
  binding: FormFieldBinding<TValue>;
  children?: ReactNode;
  className?: string;
  /**
   * `stack` — label, control, description, issue (default).
   * `choice` — control, then label / description / issue (checkbox, switch).
   * `group` — `FieldSet` + legend (checkbox / radio lists).
   */
  layout?: FormFieldFrameLayout;
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

function FrameError({ content }: { content: ReactNode }) {
  if (!content) return null;
  return (
    <FieldError
      className="wrap-anywhere"
      errors={typeof content === "string" ? [{ message: content }] : undefined}
    >
      {typeof content === "string" ? undefined : content}
    </FieldError>
  );
}

/**
 * shadcn field chrome around a control. Built-in widgets use this;
 * custom widgets should too.
 */
export function FormFieldFrame<TValue = unknown>({
  binding,
  children,
  className,
  layout = "stack",
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
  const labelId = `${field.id}-label`;
  const labelContent = label === false ? null : (label ?? fieldLabel(field));
  const descriptionContent =
    description === false
      ? null
      : (description ??
        (typeof field.description === "string" ? field.description : null));
  const errorContent = error === false ? null : (error ?? issue ?? null);
  const requiredMark =
    requiredIndicator && binding.required ? <RequiredMark /> : null;
  const descriptionNode = descriptionContent ? (
    <FieldDescription>{descriptionContent}</FieldDescription>
  ) : null;
  const errorNode = <FrameError content={errorContent} />;
  const invalidProps = {
    className: cn(className),
    "data-invalid": invalid || undefined,
    "data-disabled": binding.disabled || undefined,
  };

  if (layout === "group") {
    return (
      <FieldSet {...invalidProps}>
        {labelContent ? (
          <FieldLegend id={labelId} variant="label">
            {labelContent}
            {requiredMark}
          </FieldLegend>
        ) : null}
        {children}
        {descriptionNode}
        {errorNode}
      </FieldSet>
    );
  }

  if (layout === "choice") {
    return (
      <Field {...invalidProps} orientation="horizontal">
        {children}
        <FieldContent>
          {labelContent ? (
            <FieldLabel id={labelId} htmlFor={field.id} className="font-normal">
              {labelContent}
              {requiredMark}
            </FieldLabel>
          ) : null}
          {descriptionNode}
          {errorNode}
        </FieldContent>
      </Field>
    );
  }

  return (
    <Field {...invalidProps} orientation={orientation}>
      {labelContent ? (
        <FieldLabel id={labelId} htmlFor={field.id}>
          {labelContent}
          {requiredMark}
        </FieldLabel>
      ) : null}
      {children}
      {descriptionNode}
      {errorNode}
    </Field>
  );
}
