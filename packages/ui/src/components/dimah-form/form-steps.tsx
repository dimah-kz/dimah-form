"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import {
  formCompletion,
  type FormAnswers,
  type FormField,
  type FormResponseApi,
} from "@dimah-form/react";
import { useTranslations } from "@fuma-translate/react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { useFormSession } from "@/components/dimah-form/form-context";
import {
  FormFields,
  type FormFieldsProps,
} from "@/components/dimah-form/form-fields";
import { useFormUi } from "@/hooks/use-form-ui";
import { groupFieldsByStep } from "@/lib/field-groups";
import { scheduleFocusInvalidField } from "@/lib/focus-invalid";

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
  next: () => Promise<boolean>;
  prev: () => void;
  goTo: (index: number) => Promise<boolean>;
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

/** `null` when no {@link FormSteps} ancestor — used by {@link FormRoot}. */
export function useFormStepsOptional<
  TAnswers extends FormAnswers = FormAnswers,
>(): FormStepsApi<TAnswers> | null {
  return useContext(FormStepsContext) as FormStepsApi<TAnswers> | null;
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

  async function validateStep(): Promise<boolean> {
    if (!step) return true;
    const issues = await session.validate("submit", {
      fields: step.fields.map((field) => field.id),
    });
    return issues.length === 0;
  }

  const api: FormStepsApi<TAnswers> = {
    form: session,
    steps,
    index: safe,
    step,
    total,
    isFirst: safe <= 0,
    isLast: total === 0 || safe >= total - 1,
    complete,
    next: async () => {
      if (total === 0 || safe >= total - 1) return false;
      if (!(await validateStep())) return false;
      setIndex((value) => Math.min(value + 1, Math.max(total - 1, 0)));
      return true;
    },
    prev: () => {
      setIndex((value) => Math.max(value - 1, 0));
    },
    goTo: async (nextIndex) => {
      if (nextIndex < 0 || nextIndex >= total) return false;
      if (nextIndex > safe && !(await validateStep())) return false;
      setIndex(nextIndex);
      return true;
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

export type FormStepHeadingProps = {
  className?: string;
};

/** Step title, or “Step N of M”. Hidden when there is only one step. */
export function FormStepHeading({ className }: FormStepHeadingProps) {
  const steps = useFormSteps();
  const t = useTranslations();
  if (steps.total <= 1 || !steps.step) return null;

  const named =
    steps.step.title !== steps.step.key ? steps.step.title : undefined;
  const label =
    named ??
    t("Step {current} of {total}", {
      note: "step heading",
      variables: {
        current: String(steps.index + 1),
        total: String(steps.total),
      },
    });

  return (
    <p className={cn("text-sm font-medium text-balance", className)}>{label}</p>
  );
}

export type FormStepNavProps = {
  className?: string;
  /** Rendered on the last step in place of Next (usually {@link FormActions}). */
  children?: ReactNode;
};

function focusStepIssues(target: HTMLElement) {
  const root = target.closest("form");
  if (root) scheduleFocusInvalidField(root);
}

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
          disabled={ui.busy}
          onClick={(event) => {
            const target = event.currentTarget;
            void steps.next().then((advanced) => {
              if (!advanced) focusStepIssues(target);
            });
          }}
        >
          {ui.nextLabel}
        </Button>
      )}
    </div>
  );
}
