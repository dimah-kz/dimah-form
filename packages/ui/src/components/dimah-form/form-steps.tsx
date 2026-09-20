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
import { FieldTitle } from "@/components/ui/field";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useFormSession } from "@/components/dimah-form/form-context";
import {
  FormFields,
  type FormFieldsProps,
} from "@/components/dimah-form/form-fields";
import { useFormUi } from "@/hooks/use-form-ui";
import { visibleSteps } from "@/lib/field-groups";
import { readFormUiMeta } from "@/lib/field-ui-meta";
import { scheduleFocusInvalidField } from "@/lib/focus-invalid";

export type FormStep = {
  key: string;
  title: string;
  fields: FormField[];
};

export type FormStepsApi<TAnswers extends FormAnswers = FormAnswers> = {
  form: FormResponseApi<TAnswers>;
  steps: FormStep[];
  /** Stable page id (`meta.step`, default `"1"`). */
  key: string;
  index: number;
  step: FormStep | undefined;
  total: number;
  isFirst: boolean;
  isLast: boolean;
  /** Visible required fields on the current step all have answers. */
  complete: boolean;
  next: () => Promise<boolean>;
  prev: () => void;
  goTo: (indexOrKey: number | string) => Promise<boolean>;
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
  /** Controlled step key. */
  step?: string;
  /** Uncontrolled initial step key. */
  defaultStep?: string;
  onStepChange?: (step: string) => void;
  children: ReactNode;
};

function resolveStepKey(
  keys: readonly string[],
  requested: string | undefined,
): string {
  if (requested && keys.includes(requested)) return requested;
  return keys[0] ?? "";
}

/**
 * Groups snapshot fields by `meta.step` (number or string; default `"1"`).
 * Hidden fields drop out of the page; empty pages are omitted.
 * Compose {@link FormStepFields} + {@link FormStepNav} inside it.
 */
export function FormSteps<TAnswers extends FormAnswers = FormAnswers>({
  form,
  step: stepKey,
  defaultStep,
  onStepChange,
  children,
}: FormStepsProps<TAnswers>) {
  const session = useFormSession(form);
  const stepTitles = readFormUiMeta(session.snapshot).steps;
  const steps = visibleSteps(
    session.snapshot.fields,
    session.visibleFields,
    stepTitles,
  ).map((group) => ({
    key: group.key,
    title: group.title ?? group.key,
    fields: group.fields,
  }));
  const keys = steps.map((item) => item.key);
  const [uncontrolled, setUncontrolled] = useState(defaultStep);
  const requested = stepKey ?? uncontrolled;
  const currentKey = resolveStepKey(keys, requested);

  if (stepKey === undefined && uncontrolled !== currentKey && currentKey) {
    setUncontrolled(currentKey);
  }

  const index = currentKey ? Math.max(0, keys.indexOf(currentKey)) : 0;
  const total = steps.length;
  const current = steps[index];
  const complete = current
    ? formCompletion({ fields: current.fields }, session.answers).complete
    : true;

  function setCurrent(nextKey: string) {
    onStepChange?.(nextKey);
    if (stepKey === undefined) setUncontrolled(nextKey);
  }

  async function validateStep(): Promise<boolean> {
    if (!current) return true;
    const issues = await session.validate("submit", {
      fields: current.fields.map((field) => field.id),
    });
    return issues.length === 0;
  }

  function resolveIndex(indexOrKey: number | string): number {
    if (typeof indexOrKey === "number") return indexOrKey;
    return keys.indexOf(indexOrKey);
  }

  const api: FormStepsApi<TAnswers> = {
    form: session,
    steps,
    key: currentKey,
    index,
    step: current,
    total,
    isFirst: index <= 0,
    isLast: total === 0 || index >= total - 1,
    complete,
    next: async () => {
      if (total === 0 || index >= total - 1) return false;
      if (!(await validateStep())) return false;
      const nextKey = keys[index + 1];
      if (!nextKey) return false;
      setCurrent(nextKey);
      return true;
    },
    prev: () => {
      const prevKey = keys[Math.max(index - 1, 0)];
      if (prevKey) setCurrent(prevKey);
    },
    goTo: async (indexOrKey) => {
      const nextIndex = resolveIndex(indexOrKey);
      if (nextIndex < 0 || nextIndex >= total) return false;
      if (nextIndex > index && !(await validateStep())) return false;
      const nextKey = keys[nextIndex];
      if (!nextKey) return false;
      setCurrent(nextKey);
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

function numberedStepLabel(
  index: number,
  total: number,
  t: ReturnType<typeof useTranslations>,
): string {
  return t("Step {current} of {total}", {
    note: "step heading",
    variables: {
      current: String(index + 1),
      total: String(total),
    },
  });
}

function stepLabel(
  step: Pick<FormStep, "key" | "title">,
  index: number,
  total: number,
  t: ReturnType<typeof useTranslations>,
): string {
  return step.title !== step.key
    ? step.title
    : numberedStepLabel(index, total, t);
}

/** Step title, or “Step N of M”. Hidden when there is only one step. */
export function FormStepHeading({ className }: FormStepHeadingProps) {
  const steps = useFormSteps();
  const t = useTranslations();
  if (steps.total <= 1 || !steps.step) return null;

  return (
    <FieldTitle
      data-slot="form-step-heading"
      className={cn("text-balance", className)}
    >
      {stepLabel(steps.step, steps.index, steps.total, t)}
    </FieldTitle>
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
      data-slot="form-step-nav"
      className={cn(
        "gap-3 flex flex-wrap items-center justify-between",
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

export type FormStepListProps = {
  className?: string;
};

/** Jump list of step titles. Hidden when there is only one step. */
export function FormStepList({ className }: FormStepListProps) {
  const steps = useFormSteps();
  const ui = useFormUi(steps.form);
  const t = useTranslations();
  if (steps.total <= 1) return null;

  return (
    <ToggleGroup
      data-slot="form-step-list"
      variant="outline"
      size="sm"
      spacing={1}
      className={cn("max-w-full flex-wrap", className)}
      disabled={ui.busy}
      value={steps.key ? [steps.key] : []}
      aria-label={t("Steps", { note: "step list" })}
      onValueChange={(next) => {
        const key = next[0];
        if (typeof key === "string" && key !== steps.key) {
          void steps.goTo(key);
        }
      }}
    >
      {steps.steps.map((item, index) => (
        <ToggleGroupItem
          key={item.key}
          value={item.key}
          aria-current={index === steps.index ? "step" : undefined}
        >
          {stepLabel(item, index, steps.total, t)}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
