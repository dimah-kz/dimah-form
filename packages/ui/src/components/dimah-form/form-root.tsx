"use client";

import type { ComponentProps } from "react";
import type { FormAnswers, FormResponseApi } from "@dimah-form/react";
import { cn } from "cn";
import { useFormSession } from "@/components/dimah-form/form-context";
import { scheduleFocusInvalidField } from "@/lib/focus-invalid";

export type FormRootProps<TAnswers extends FormAnswers = FormAnswers> = Omit<
  ComponentProps<"form">,
  "onSubmit"
> & {
  form?: FormResponseApi<TAnswers>;
};

/**
 * Native `<form>` that submits the fill session. Use inside {@link FormScope}
 * or pass `form`. {@link FormView} wraps this.
 */
export function FormRoot<TAnswers extends FormAnswers = FormAnswers>({
  form,
  className,
  children,
  noValidate = true,
  ...props
}: FormRootProps<TAnswers>) {
  const session = useFormSession(form);

  return (
    <form
      {...props}
      noValidate={noValidate}
      className={cn("text-start text-dimah-form-foreground", className)}
      onSubmit={(event) => {
        event.preventDefault();
        if (session.locked) return;
        const root = event.currentTarget;
        void session.submit().then((row) => {
          if (!row) scheduleFocusInvalidField(root);
        });
      }}
    >
      {children}
    </form>
  );
}
