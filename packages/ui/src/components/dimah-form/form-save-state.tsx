"use client";

import type { FormAnswers, FormResponseApi } from "@dimah-form/react";
import { useTranslations } from "@fuma-translate/react";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
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

  if (session.pending === "save") {
    return (
      <Badge
        variant="secondary"
        data-slot="form-save-state"
        className={className}
        aria-live="polite"
      >
        <Spinner data-icon="inline-start" />
        {t("Saving…", { note: "form action" })}
      </Badge>
    );
  }

  if (session.dirty) {
    return (
      <Badge
        variant="outline"
        data-slot="form-save-state"
        className={className}
        aria-live="polite"
      >
        {t("Unsaved changes", { note: "save state" })}
      </Badge>
    );
  }

  if (session.autosave && session.responseId) {
    return (
      <Badge
        variant="secondary"
        data-slot="form-save-state"
        className={className}
        aria-live="polite"
      >
        {t("Saved", { note: "save state" })}
      </Badge>
    );
  }

  return null;
}
