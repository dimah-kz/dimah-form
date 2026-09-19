"use client";

import type { FormAnswers, FormResponseApi } from "@dimah-form/react";
import { useTranslations } from "@fuma-translate/react";
import { cn } from "cn";
import { useFormSession } from "@/components/dimah-form/form-context";
import { useFormStepsOptional } from "@/components/dimah-form/form-steps";

export type FormProgressClassNames = {
  root?: string;
  label?: string;
  track?: string;
  bar?: string;
};

export type FormProgressProps<TAnswers extends FormAnswers = FormAnswers> = {
  form?: FormResponseApi<TAnswers>;
  className?: string;
  classNames?: FormProgressClassNames;
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
  classNames,
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
    const percent = Math.round((current / steps.total) * 100);
    return (
      <ProgressBar
        className={className}
        classNames={classNames}
        label={label}
        now={current}
        max={steps.total}
        percent={percent}
      />
    );
  }

  const { required, answered } = session.completion;
  if (required === 0) return null;

  const percent = Math.round((answered / required) * 100);
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
      classNames={classNames}
      label={label}
      now={answered}
      max={required}
      percent={percent}
    />
  );
}

function ProgressBar({
  className,
  classNames,
  label,
  now,
  max,
  percent,
}: {
  className?: string;
  classNames?: FormProgressClassNames;
  label: string;
  now: number;
  max: number;
  percent: number;
}) {
  return (
    <div
      data-slot="form-progress"
      className={cn("gap-2 flex flex-col", className, classNames?.root)}
    >
      <p
        className={cn(
          "text-sm text-dimah-form-muted-foreground",
          classNames?.label,
        )}
      >
        {label}
      </p>
      <div
        className={cn(
          "h-1 overflow-hidden rounded-full bg-dimah-form-muted",
          classNames?.track,
        )}
        role="progressbar"
        aria-label={label}
        aria-valuenow={now}
        aria-valuemin={0}
        aria-valuemax={max}
      >
        <div
          className={cn(
            "origin-start h-full bg-dimah-form-primary transition-[width]",
            classNames?.bar,
          )}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
