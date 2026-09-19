"use client";

import type { ReactNode } from "react";
import type { FormAnswers, FormResponseApi } from "@dimah-form/react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { useFormSession } from "@/components/dimah-form/form-context";
import { useFormUi } from "@/hooks/use-form-ui";

export type FormActionsProps<TAnswers extends FormAnswers = FormAnswers> = {
  form?: FormResponseApi<TAnswers>;
  className?: string;
  /** Replace the default save / submit / edit controls. */
  children?: ReactNode;
};

/** Save + submit, or Edit when the response is locked. */
export function FormActions<TAnswers extends FormAnswers = FormAnswers>({
  form,
  className,
  children,
}: FormActionsProps<TAnswers>) {
  const session = useFormSession(form);
  const ui = useFormUi(session);

  return (
    <Field
      orientation="horizontal"
      className={cn("flex-wrap justify-end", className)}
    >
      {children ??
        (session.locked ? (
          <Button
            type="button"
            variant="outline"
            disabled={ui.busy || !session.responseId}
            onClick={() => void session.reopen()}
          >
            {session.pending === "reopen" ? (
              <Spinner data-icon="inline-start" />
            ) : null}
            {ui.editLabel}
          </Button>
        ) : (
          <>
            <Button
              type="button"
              variant="outline"
              disabled={ui.busy}
              onClick={() => void session.saveDraft()}
            >
              {session.pending === "save" ? (
                <Spinner data-icon="inline-start" />
              ) : null}
              {ui.saveLabel}
            </Button>
            <Button type="submit" disabled={ui.busy}>
              {session.pending === "submit" ? (
                <Spinner data-icon="inline-start" />
              ) : null}
              {ui.submitLabel}
            </Button>
          </>
        ))}
    </Field>
  );
}
