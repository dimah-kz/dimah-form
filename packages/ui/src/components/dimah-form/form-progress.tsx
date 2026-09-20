"use client";

import type { FormAnswers, FormResponseApi } from "@dimah-form/react";
import { useTranslations } from "@fuma-translate/react";
import { cn } from "cn";
import { Progress, ProgressLabel } from "@/components/ui/progress";
import { useFormSession } from "@/components/dimah-form/form-context";
import { useFormStepsOptional } from "@/components/dimah-form/form-steps";

export type FormProgressProps<TAnswers extends FormAnswers = FormAnswers> = {
  form?: FormResponseApi<TAnswers>;
  className?: string;
  /**
   * `required` — answered / required visible fields.
   * `step` — current wizard page.
   * `auto` (default) — step when inside {@link FormSteps} with more than one
   * page, otherwise required.
   */
  variant?: "auto" | "required" | "step";
};

/**
 * Required-field completion, or wizard page. Hidden when there is nothing
 * to measure.
 */
export function FormProgress<TAnswers extends FormAnswers = FormAnswers>({
  form,
  className,
  variant = "auto",
}: FormProgressProps<TAnswers>) {
  const session = useFormSession(form);
  const steps = useFormStepsOptional();
  const t = useTranslations();
  const useStep =
    variant === "step" ||
    (variant === "auto" && steps != null && steps.total > 1);

  if (useStep && steps) {
    if (steps.total <= 1) return null;
    const current = steps.index + 1;
    const label = t("Step {current} of {total}", {
      note: "step heading",
      variables: {
        current: String(current),
        total: String(steps.total),
      },
    });
    return (
      <ProgressBar
        className={className}
        label={label}
        now={current}
        max={steps.total}
      />
    );
  }

  const { required, answered } = session.completion;
  if (required === 0) return null;

  const label = t("{answered} of {required} required", {
    note: "progress",
    variables: {
      answered: String(answered),
      required: String(required),
    },
  });

  return (
    <ProgressBar
      className={className}
      label={label}
      now={answered}
      max={required}
    />
  );
}

function ProgressBar({
  className,
  label,
  now,
  max,
}: {
  className?: string;
  label: string;
  now: number;
  max: number;
}) {
  return (
    <Progress
      data-slot="form-progress"
      className={cn("gap-2 w-full", className)}
      value={now}
      max={max}
      getAriaValueText={() => label}
    >
      <ProgressLabel className="font-normal w-full text-dimah-form-muted-foreground">
        {label}
      </ProgressLabel>
    </Progress>
  );
}
