"use client";

import type { FormAnswers, FormResponseApi } from "@dimah-form/react";
import { CircleAlertIcon, CircleCheckIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useFormSession } from "@/components/dimah-form/form-context";
import { useFormUi } from "@/hooks/use-form-ui";

export type FormStatusProps<TAnswers extends FormAnswers = FormAnswers> = {
  form?: FormResponseApi<TAnswers>;
  className?: string;
};

/** Submitted / abandoned banners. Renders nothing while the response is a draft. */
export function FormStatus<TAnswers extends FormAnswers = FormAnswers>({
  form,
  className,
}: FormStatusProps<TAnswers>) {
  const session = useFormSession(form);
  const ui = useFormUi(session);

  if (session.status === "submitted") {
    return (
      <Alert className={className}>
        <CircleCheckIcon />
        <AlertTitle>{ui.submittedTitle}</AlertTitle>
        <AlertDescription>{ui.submittedMessage}</AlertDescription>
      </Alert>
    );
  }

  if (session.status === "abandoned") {
    return (
      <Alert className={className}>
        <CircleAlertIcon />
        <AlertTitle>{ui.abandonedTitle}</AlertTitle>
        <AlertDescription>{ui.abandonedMessage}</AlertDescription>
      </Alert>
    );
  }

  return null;
}
