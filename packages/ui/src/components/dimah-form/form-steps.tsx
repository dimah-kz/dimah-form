"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import {
  formCompletion,
  type FormAnswers,
  type FormField,
  type FormResponseApi,
} from "@dimah-form/react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { useFormSession } from "@/components/dimah-form/form-context";
import {
  FormFields,
  type FormFieldsProps,
} from "@/components/dimah-form/form-fields";
import { useFormUi } from "@/hooks/use-form-ui";
import { groupFieldsByStep } from "@/lib/field-groups";

export type FormStep = {
  key: string;
  title: string;
  fields: FormField[];
};

export type FormStepsApi<TAnswers extends FormAnswers = FormAnswers> = {
  form: FormResponseApi<TAnswers>;
  steps: FormStep[];
  index: number;
  step: FormStep | undefined;
  total: number;
  isFirst: boolean;
  isLast: boolean;
  /** Visible required fields on the current step all have answers. */
  complete: boolean;
  next: () => void;
  prev: () => void;
  goTo: (index: number) => void;
};

const FormStepsContext = createContext<FormStepsApi | null>(null);

export function useFormSteps<
  TAnswers extends FormAnswers = FormAnswers,
>(): FormStepsApi<TAnswers> {
  const ctx = useContext(FormStepsContext);
  if (ctx == null) {
    throw new Error("useFormSteps requires a FormSteps ancestor");
  }
  return ctx as FormStepsApi<TAnswers>;
}

export type FormStepsProps<TAnswers extends FormAnswers = FormAnswers> = {
  form?: FormResponseApi<TAnswers>;
  children: ReactNode;
};

/**
 * Groups `visibleFields` by `meta.step` (number or string; default `"1"`).
 * Compose {@link FormStepFields} + {@link FormStepNav} inside it.
 */
export function FormSteps<TAnswers extends FormAnswers = FormAnswers>({
  form,
  children,
}: FormStepsProps<TAnswers>) {
  const session = useFormSession(form);
  const steps = groupFieldsByStep(session.visibleFields).map((group) => ({
    key: group.key,
    title: group.title ?? group.key,
    fields: group.fields,
  }));
  const [index, setIndex] = useState(0);
  const total = steps.length;
  const safe = total === 0 ? 0 : Math.min(index, total - 1);
  if (safe !== index) setIndex(safe);

  const step = steps[safe];
  const complete = step
    ? formCompletion({ fields: step.fields }, session.answers).complete
    : true;

  const api: FormStepsApi<TAnswers> = {
    form: session,
    steps,
    index: safe,
    step,
    total,
    isFirst: safe <= 0,
    isLast: total === 0 || safe >= total - 1,
    complete,
    next: () => {
      if (!complete) return;
      setIndex((value) => Math.min(value + 1, Math.max(total - 1, 0)));
    },
    prev: () => {
      setIndex((value) => Math.max(value - 1, 0));
    },
    goTo: (nextIndex) => {
      if (nextIndex < 0 || nextIndex >= total) return;
      if (nextIndex > safe && !complete) return;
      setIndex(nextIndex);
    },
  };

  return (
    <FormStepsContext.Provider value={api as FormStepsApi}>
      {children}
    </FormStepsContext.Provider>
  );
}

export function FormStepFields<TAnswers extends FormAnswers = FormAnswers>(
  props: Omit<FormFieldsProps<TAnswers>, "fields">,
) {
  const { step } = useFormSteps<TAnswers>();
  return (
    <FormFields
      {...props}
      fields={step?.fields.map((field) => field.id) ?? []}
    />
  );
}

export type FormStepNavProps = {
  className?: string;
  /** Rendered on the last step in place of Next (usually {@link FormActions}). */
  children?: ReactNode;
};

/** Previous / Next. Hidden when every visible field shares one step. */
export function FormStepNav({ className, children }: FormStepNavProps) {
  const steps = useFormSteps();
  const ui = useFormUi(steps.form);
  if (steps.total <= 1) return children ?? null;

  return (
    <div
      className={cn(
        "gap-2 flex flex-wrap items-center justify-between",
        className,
      )}
    >
      <Button
        type="button"
        variant="outline"
        disabled={steps.isFirst || ui.busy}
        onClick={steps.prev}
      >
        {ui.previousLabel}
      </Button>
      {steps.isLast ? (
        children
      ) : (
        <Button
          type="button"
          disabled={ui.busy || !steps.complete}
          onClick={steps.next}
        >
          {ui.nextLabel}
        </Button>
      )}
    </div>
  );
}
