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
    <FieldSet className={cn(className)}>
      {title ? <FieldLegend>{title}</FieldLegend> : null}
      {description ? <FieldDescription>{description}</FieldDescription> : null}
      {children}
    </FieldSet>
  );
}
