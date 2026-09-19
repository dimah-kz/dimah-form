"use client";

import { useTranslations } from "@fuma-translate/react";
import { FormFieldFrame } from "@/components/dimah-form/form-field-frame";
import { reviewValue } from "@/lib/review-value";
import type { FieldWidgetProps } from "@/lib/widget-registry";

/** Read-only value used by built-in widgets when `mode="review"`. */
export function FieldReviewValue({ binding, className }: FieldWidgetProps) {
  const t = useTranslations();
  const field = binding.field;
  if (!field) return null;

  const formatted = reviewValue(field, binding.value, {
    yes: t("Yes", { note: "review" }),
    no: t("No", { note: "review" }),
    empty: t("Not answered", { note: "review" }),
  });

  return (
    <FormFieldFrame binding={binding} className={className}>
      <p data-slot="field-review-value" className="wrap-anywhere">
        {formatted}
      </p>
    </FormFieldFrame>
  );
}
