"use client";

import type { ReactNode } from "react";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
} from "@/components/ui/field";

export function ChoiceOption({
  id,
  label,
  description,
  disabled,
  control,
}: {
  id: string;
  label: string;
  description?: string;
  disabled?: boolean;
  control: ReactNode;
}) {
  return (
    <Field
      orientation="horizontal"
      data-disabled={disabled || undefined}
      className="items-start"
    >
      {control}
      <FieldContent>
        <FieldLabel
          htmlFor={id}
          className="font-normal cursor-pointer select-none"
        >
          {label}
        </FieldLabel>
        {description ? (
          <FieldDescription className="text-xs">{description}</FieldDescription>
        ) : null}
      </FieldContent>
    </Field>
  );
}
