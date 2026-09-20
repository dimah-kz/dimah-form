"use client";

import type { ReactNode } from "react";
import {
  fieldLabel,
  type FormAnswers,
  type FormField,
  type FormResponseApi,
} from "@dimah-form/react";
import { useTranslations } from "@fuma-translate/react";
import { cn } from "cn";
import { useFormSession } from "@/components/dimah-form/form-context";
import { reviewValue } from "@/lib/review-value";

export type FormReviewProps<TAnswers extends FormAnswers = FormAnswers> = {
  form?: FormResponseApi<TAnswers>;
  className?: string;
  renderValue?: (ctx: {
    field: FormField;
    value: unknown;
    formatted: string;
  }) => ReactNode;
};

/**
 * Compact read-only `<dl>` of visible answers (`formatAnswer` / option labels).
 * FormView locked review uses widgets (`mode="review"`) by default.
 * Opt in with `review={<FormReview />}` or `components={{ Review: FormReview }}`.
 */
export function FormReview<TAnswers extends FormAnswers = FormAnswers>({
  form,
  className,
  renderValue,
}: FormReviewProps<TAnswers>) {
  const session = useFormSession(form);
  const t = useTranslations();
  const labels = {
    yes: t("Yes", { note: "review" }),
    no: t("No", { note: "review" }),
    empty: t("Not answered", { note: "review" }),
  };

  if (session.visibleFields.length === 0) return null;

  return (
    <dl
      data-slot="form-review"
      className={cn("gap-3 flex flex-col", className)}
    >
      {session.visibleFields.map((field) => {
        const value = session.answers[field.id];
        const formatted = reviewValue(field, value, labels);
        return (
          <div key={field.id} className="gap-0.5 flex flex-col">
            <dt className="text-sm text-dimah-form-muted-foreground">
              {fieldLabel(field)}
            </dt>
            <dd className="wrap-anywhere">
              {renderValue
                ? renderValue({ field, value, formatted })
                : formatted}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}
