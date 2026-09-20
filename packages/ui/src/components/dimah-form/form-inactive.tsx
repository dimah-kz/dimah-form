"use client";

import type { FormAnswers, FormResponseApi } from "@dimah-form/react";
import { CircleAlertIcon } from "lucide-react";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
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
    <Empty data-slot="form-inactive" className={className}>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <CircleAlertIcon />
        </EmptyMedia>
        <EmptyTitle>{ui.inactiveTitle}</EmptyTitle>
        <EmptyDescription>{ui.inactiveMessage}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
