"use client";

import { FormFieldFrame, type FieldWidgetProps } from "@dimah-form/ui";

import { StarRating } from "@/components/star-rating";
import { ratingMax } from "@/lib/field-display";

export function StarRatingField({ className, ...binding }: FieldWidgetProps) {
  const field = binding.field;
  if (!field) return null;

  return (
    <FormFieldFrame binding={binding} className={className}>
      <StarRating
        id={field.id}
        value={binding.value}
        max={ratingMax(field)}
        disabled={binding.disabled}
        invalid={binding.invalid}
        required={binding.required}
        onChange={(value) => binding.onChange(value)}
      />
    </FormFieldFrame>
  );
}
