"use client";

import type { ReactNode } from "react";
import { cn } from "cn";
import { FieldDescription, FieldLegend, FieldSet } from "@/components/ui/field";

export type FormSectionProps = {
  title?: ReactNode;
  description?: ReactNode;
  className?: string;
  children?: ReactNode;
};

/** Fieldset + legend for `meta.section` groups (or a hand-built layout). */
export function FormSection({
  title,
  description,
  className,
  children,
}: FormSectionProps) {
  return (
    <FieldSet data-slot="form-section" className={cn("pt-1", className)}>
      {title ? (
        <FieldLegend className="text-base font-semibold text-dimah-form-foreground">
          {title}
        </FieldLegend>
      ) : null}
      {description ? (
        <FieldDescription className="text-sm text-dimah-form-muted-foreground">
          {description}
        </FieldDescription>
      ) : null}
      {children}
    </FieldSet>
  );
}
