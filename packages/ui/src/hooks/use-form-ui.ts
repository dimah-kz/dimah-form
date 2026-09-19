"use client";

import type { FormAnswers, FormResponseApi } from "@dimah-form/react";
import { useTranslations } from "@fuma-translate/react";

/**
 * Localized chrome for {@link FormView}. Does not call `useFormResponse`.
 */
export function useFormUi<TAnswers extends FormAnswers = FormAnswers>(
  form: FormResponseApi<TAnswers>,
) {
  const t = useTranslations();
  const busy = form.pending != null;

  return {
    busy,
    saveLabel:
      form.pending === "save"
        ? t("Saving…", { note: "form action" })
        : t("Save draft", { note: "form action" }),
    submitLabel:
      form.pending === "submit"
        ? t("Submitting…", { note: "form action" })
        : t("Submit", { note: "form action" }),
    inactiveTitle: t("Form unavailable", { note: "inactive" }),
    inactiveMessage: t("This form is not available", { note: "inactive" }),
  };
}
