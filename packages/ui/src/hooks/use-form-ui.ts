"use client";

import type { FormAnswers, FormResponseApi } from "@dimah-form/react";
import { useTranslations } from "@fuma-translate/react";
import { useFormSession } from "@/components/dimah-form/form-context";

/**
 * Localized chrome strings. Does not call `useFormResponse`.
 */
export function useFormUi<TAnswers extends FormAnswers = FormAnswers>(
  form?: FormResponseApi<TAnswers>,
) {
  const session = useFormSession(form);
  const t = useTranslations();
  const busy = session.pending != null;
  const responseId = session.responseId ?? "";

  return {
    form: session,
    busy,
    saveLabel:
      session.pending === "save"
        ? t("Saving…", { note: "form action" })
        : t("Save draft", { note: "form action" }),
    submitLabel:
      session.pending === "submit"
        ? t("Submitting…", { note: "form action" })
        : t("Submit", { note: "form action" }),
    editLabel:
      session.pending === "reopen"
        ? t("Reopening…", { note: "form action" })
        : t("Edit", { note: "form action" }),
    previousLabel: t("Previous", { note: "step nav" }),
    nextLabel: t("Next", { note: "step nav" }),
    inactiveTitle: t("Form unavailable", { note: "inactive" }),
    inactiveMessage: t("This form is not available", { note: "inactive" }),
    submittedTitle: t("Submitted", { note: "status" }),
    submittedMessage: t("Response {id}", {
      note: "status",
      variables: { id: responseId },
    }),
    abandonedTitle: t("Abandoned", { note: "status" }),
    abandonedMessage: t("This draft is closed", { note: "status" }),
  };
}
