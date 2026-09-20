"use client";

import {
  FormFieldFrame,
  fieldNumber,
  type FieldWidgetProps,
} from "@dimah-form/ui";

import { StarRating } from "@/components/fields/star-rating";

export function StarRatingField({
  binding,
  className,
  mode,
}: FieldWidgetProps<number>) {
  const field = binding.field;
  if (!field) return null;

  const max = fieldNumber(field, "max");
  const review = mode === "review";

  return (
    <FormFieldFrame binding={binding} className={className}>
      <StarRating
        id={field.id}
        value={binding.value}
        max={max && max > 0 ? max : 5}
        disabled={binding.disabled || review}
        invalid={review ? false : binding.invalid}
        required={binding.required}
        onChange={(value) => {
          if (review) return;
          binding.onChange(value);
        }}
      />
    </FormFieldFrame>
  );
}
