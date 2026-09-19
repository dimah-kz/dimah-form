"use client";

import type { FormAnswers, FormResponseApi } from "@dimah-form/react";
import { CircleAlertIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useFormSession } from "@/components/dimah-form/form-context";
import { useFormUi } from "@/hooks/use-form-ui";

export type FormInactiveProps<TAnswers extends FormAnswers = FormAnswers> = {
  form?: FormResponseApi<TAnswers>;
  className?: string;
};

/** Shown when the live form is not `active` and there is no row to resume. */
export function FormInactive<TAnswers extends FormAnswers = FormAnswers>({
  form,
  className,
}: FormInactiveProps<TAnswers>) {
  const session = useFormSession(form);
  const ui = useFormUi(session);

  return (
    <Alert className={className}>
      <CircleAlertIcon />
      <AlertTitle>{ui.inactiveTitle}</AlertTitle>
      <AlertDescription>{ui.inactiveMessage}</AlertDescription>
    </Alert>
  );
}
