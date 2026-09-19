"use client";

import type { ReactNode } from "react";
import type { FormAnswers, FormResponseApi } from "@dimah-form/react";
import { cn } from "cn";
import { FieldDescription, FieldLegend, FieldSet } from "@/components/ui/field";
import { useFormSession } from "@/components/dimah-form/form-context";

export type FormHeaderProps<TAnswers extends FormAnswers = FormAnswers> = {
  form?: FormResponseApi<TAnswers>;
  className?: string;
  /** `false` hides. Omit for `snapshot.title`. */
  title?: ReactNode | false;
  /** `false` hides. Omit for `snapshot.description`. */
  description?: ReactNode | false;
};

/** Title + description as shadcn `FieldSet` / `FieldLegend`. */
export function FormHeader<TAnswers extends FormAnswers = FormAnswers>({
  form,
  className,
  title,
  description,
}: FormHeaderProps<TAnswers>) {
  const session = useFormSession(form);
  const titleContent =
    title === false ? null : (title ?? session.snapshot.title);
  const descriptionContent =
    description === false
      ? null
      : (description ?? session.snapshot.description ?? null);

  if (!titleContent && !descriptionContent) return null;

  return (
    <FieldSet data-slot="form-header" className={cn(className)}>
      {titleContent ? (
        <FieldLegend className="text-lg font-semibold text-balance">
          {titleContent}
        </FieldLegend>
      ) : null}
      {descriptionContent ? (
        <FieldDescription className="text-pretty text-dimah-form-muted-foreground">
          {descriptionContent}
        </FieldDescription>
      ) : null}
    </FieldSet>
  );
}
