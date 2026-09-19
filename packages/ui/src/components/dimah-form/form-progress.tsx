"use client";

import type { FormAnswers, FormResponseApi } from "@dimah-form/react";
import { useTranslations } from "@fuma-translate/react";
import { cn } from "cn";
import { useFormSession } from "@/components/dimah-form/form-context";

export type FormProgressProps<TAnswers extends FormAnswers = FormAnswers> = {
  form?: FormResponseApi<TAnswers>;
  className?: string;
};

/**
 * Required-field completion. Hidden when no visible field is required.
 */
export function FormProgress<TAnswers extends FormAnswers = FormAnswers>({
  form,
  className,
}: FormProgressProps<TAnswers>) {
  const session = useFormSession(form);
  const t = useTranslations();
  const { required, answered } = session.completion;
  if (required === 0) return null;

  const percent = Math.round((answered / required) * 100);
  const label = t("{answered} of {required} required", {
    note: "progress",
    variables: {
      answered: String(answered),
      required: String(required),
    },
  });

  return (
    <div className={cn("gap-2 flex flex-col", className)}>
      <p className="text-sm text-dimah-form-muted-foreground">{label}</p>
      <div
        className="h-1 overflow-hidden rounded-full bg-dimah-form-muted"
        role="progressbar"
        aria-label={label}
        aria-valuenow={answered}
        aria-valuemin={0}
        aria-valuemax={required}
      >
        <div
          className="origin-start h-full bg-dimah-form-primary transition-[width]"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
