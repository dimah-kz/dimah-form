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
    <Field orientation="horizontal" data-disabled={disabled || undefined}>
      {control}
      <FieldContent>
        <FieldLabel htmlFor={id} className="font-normal">
          {label}
        </FieldLabel>
        {description ? (
          <FieldDescription>{description}</FieldDescription>
        ) : null}
      </FieldContent>
    </Field>
  );
}
