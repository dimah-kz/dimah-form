"use client";

import type { ComponentProps } from "react";
import type { FormAnswers, FormResponseApi } from "@dimah-form/react";
import { cn } from "cn";
import { useFormSession } from "@/components/dimah-form/form-context";
import { useFormStepsOptional } from "@/components/dimah-form/form-steps";
import { scheduleFocusInvalidField } from "@/lib/focus-invalid";

export type FormRootProps<TAnswers extends FormAnswers = FormAnswers> = Omit<
  ComponentProps<"form">,
  "onSubmit"
> & {
  form?: FormResponseApi<TAnswers>;
};

/**
 * Native `<form>` that submits the fill session. Use inside {@link FormScope}
 * or pass `form`. {@link FormView} wraps this. Enter on a non-last step
 * advances when rendered inside {@link FormSteps}.
 */
export function FormRoot<TAnswers extends FormAnswers = FormAnswers>({
  form,
  className,
  children,
  noValidate = true,
  ...props
}: FormRootProps<TAnswers>) {
  const session = useFormSession(form);
  const steps = useFormStepsOptional();

  return (
    <form
      {...props}
      noValidate={noValidate}
      data-status={session.status}
      data-locked={session.locked || undefined}
      data-pending={session.pending || undefined}
      className={cn(
        "text-start text-dimah-form-foreground",
        session.pending ? "opacity-90" : undefined,
        className,
      )}
      onSubmit={(event) => {
        event.preventDefault();
        if (session.locked) return;
        const root = event.currentTarget;
        if (steps && !steps.isLast) {
          void steps.next().then((advanced) => {
            if (!advanced) scheduleFocusInvalidField(root);
          });
          return;
        }
        void session.submit().then((row) => {
          if (!row) scheduleFocusInvalidField(root);
        });
      }}
    >
      {children}
    </form>
  );
}
