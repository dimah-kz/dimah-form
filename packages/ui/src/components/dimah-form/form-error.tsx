"use client";

import type { FormAnswers, FormResponseApi } from "@dimah-form/react";
import { useTranslations } from "@fuma-translate/react";
import { CircleAlertIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useFormSession } from "@/components/dimah-form/form-context";

export type FormErrorProps<TAnswers extends FormAnswers = FormAnswers> = {
  form?: FormResponseApi<TAnswers>;
  className?: string;
};

/** Session-level request error. Hidden when `form.error` is empty. */
export function FormError<TAnswers extends FormAnswers = FormAnswers>({
  form,
  className,
}: FormErrorProps<TAnswers>) {
  const session = useFormSession(form);
  const t = useTranslations();
  if (!session.error) return null;

  return (
    <Alert variant="destructive" className={className}>
      <CircleAlertIcon />
      <AlertTitle>{t("Request failed", { note: "session error" })}</AlertTitle>
      <AlertDescription className="wrap-anywhere">
        {session.error}
      </AlertDescription>
    </Alert>
  );
}
