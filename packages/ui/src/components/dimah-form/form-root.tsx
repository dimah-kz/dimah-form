"use client";

import type { FormEventHandler } from "react";
import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import type { FormAnswers, FormResponseApi } from "@dimah-form/react";
import { cn } from "cn";
import { useFormSession } from "@/components/dimah-form/form-context";
import { useFormStepsOptional } from "@/components/dimah-form/form-steps";
import { scheduleFocusInvalidField } from "@/lib/focus-invalid";

export type FormRootProps<TAnswers extends FormAnswers = FormAnswers> =
  useRender.ComponentProps<"form"> & {
    form?: FormResponseApi<TAnswers>;
  };

/**
 * Native `<form>` that submits the fill session. Use inside {@link FormScope}
 * or pass `form`. {@link FormView} wraps this. Enter on a non-last step
 * advances when rendered inside {@link FormSteps}. Replace the host with
 * Base UI `render`. `onSubmit` is composed after the session handler.
 */
export function FormRoot<TAnswers extends FormAnswers = FormAnswers>({
  form,
  className,
  children,
  noValidate = true,
  onSubmit,
  render,
  ...props
}: FormRootProps<TAnswers>) {
  const session = useFormSession(form);
  const steps = useFormStepsOptional();

  const handleSubmit: FormEventHandler<HTMLFormElement> = (event) => {
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
  };

  return useRender({
    defaultTagName: "form",
    render,
    state: {
      slot: "form-root",
      status: session.status,
      locked: session.locked,
      pending: session.pending,
    },
    props: mergeProps<"form">(
      {
        noValidate,
        className: cn(
          "text-start text-dimah-form-foreground",
          session.pending ? "opacity-90" : undefined,
          className,
        ),
        onSubmit: handleSubmit,
        children,
      },
      { ...props, onSubmit },
    ),
  });
}
