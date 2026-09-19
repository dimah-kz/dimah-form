"use client";

import {
  fieldLabel,
  formatAnswer,
  type FormAnswers,
  type FormField,
  type FormResponseApi,
} from "@dimah-form/react";
import { useTranslations } from "@fuma-translate/react";
import { cn } from "cn";
import { useFormSession } from "@/components/dimah-form/form-context";

export type FormReviewProps<TAnswers extends FormAnswers = FormAnswers> = {
  form?: FormResponseApi<TAnswers>;
  className?: string;
};

function reviewValue(
  field: FormField,
  value: unknown,
  labels: { yes: string; no: string; empty: string },
): string {
  if (field.type === "boolean") {
    if (value === true) return labels.yes;
    if (value === false) return labels.no;
    return labels.empty;
  }
  const formatted = formatAnswer(field, value);
  return formatted === "" ? labels.empty : formatted;
}

/** Read-only visible answers. Uses option labels via `formatAnswer`. */
export function FormReview<TAnswers extends FormAnswers = FormAnswers>({
  form,
  className,
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
    <dl className={cn("gap-3 flex flex-col", className)}>
      {session.visibleFields.map((field) => (
        <div key={field.id} className="gap-0.5 flex flex-col">
          <dt className="text-sm text-dimah-form-muted-foreground">
            {fieldLabel(field)}
          </dt>
          <dd className="wrap-anywhere">
            {reviewValue(field, session.answers[field.id], labels)}
          </dd>
        </div>
      ))}
    </dl>
  );
}
