"use client";

import type { ReactNode } from "react";
import type { FormAnswers, FormResponseApi } from "@dimah-form/react";
import { cn } from "cn";
import { FieldDescription, FieldLegend, FieldSet } from "@/components/ui/field";
import { useFormSession } from "@/components/dimah-form/form-context";

export type FormHeaderProps<TAnswers extends FormAnswers = FormAnswers> = {
  form?: FormResponseApi<TAnswers>;
  className?: string;
  title?: ReactNode;
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
  const descriptionContent =
    description === false
      ? null
      : (description ?? session.snapshot.description ?? null);

  return (
    <FieldSet className={cn(className)}>
      <FieldLegend className="text-lg font-semibold text-balance">
        {title ?? session.snapshot.title}
      </FieldLegend>
      {descriptionContent ? (
        <FieldDescription className="text-pretty text-dimah-form-muted-foreground">
          {descriptionContent}
        </FieldDescription>
      ) : null}
    </FieldSet>
  );
}
