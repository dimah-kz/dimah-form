"use client";

import type { FormAnswers, FormResponseApi } from "@dimah-form/react";
import { useTranslations } from "@fuma-translate/react";
import { cn } from "cn";
import { useFormSession } from "@/components/dimah-form/form-context";

export type FormSaveStateProps<TAnswers extends FormAnswers = FormAnswers> = {
  form?: FormResponseApi<TAnswers>;
  className?: string;
};

/** Draft persistence hint. Hidden when the session is clean. */
export function FormSaveState<TAnswers extends FormAnswers = FormAnswers>({
  form,
  className,
}: FormSaveStateProps<TAnswers>) {
  const session = useFormSession(form);
  const t = useTranslations();

  if (session.pending === "save") {
    return (
      <p className={cn("text-sm text-dimah-form-muted-foreground", className)}>
        {t("Saving…", { note: "form action" })}
      </p>
    );
  }

  if (!session.dirty) return null;

  return (
    <p className={cn("text-sm text-dimah-form-muted-foreground", className)}>
      {t("Unsaved changes", { note: "save state" })}
    </p>
  );
}
