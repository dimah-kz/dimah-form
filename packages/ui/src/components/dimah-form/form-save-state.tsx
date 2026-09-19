"use client";

import type { FormAnswers, FormResponseApi } from "@dimah-form/react";
import { useTranslations } from "@fuma-translate/react";
import { cn } from "cn";
import { useFormSession } from "@/components/dimah-form/form-context";

export type FormSaveStateProps<TAnswers extends FormAnswers = FormAnswers> = {
  form?: FormResponseApi<TAnswers>;
  className?: string;
};

/** Draft persistence hint. `Saved` when autosave is on and the draft is clean. */
export function FormSaveState<TAnswers extends FormAnswers = FormAnswers>({
  form,
  className,
}: FormSaveStateProps<TAnswers>) {
  const session = useFormSession(form);
  const t = useTranslations();

  let message: string | null = null;
  if (session.pending === "save") {
    message = t("Saving…", { note: "form action" });
  } else if (session.dirty) {
    message = t("Unsaved changes", { note: "save state" });
  } else if (session.autosave && session.responseId) {
    message = t("Saved", { note: "save state" });
  }

  if (!message) return null;

  return (
    <p
      className={cn("text-sm text-dimah-form-muted-foreground", className)}
      aria-live="polite"
    >
      {message}
    </p>
  );
}
