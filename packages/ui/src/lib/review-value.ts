import { formatAnswer, type FormField } from "@dimah-form/react";

export type ReviewValueLabels = {
  yes: string;
  no: string;
  empty: string;
};

/** Localized review string. Booleans use `labels`; other types use `formatAnswer`. */
export function reviewValue(
  field: FormField,
  value: unknown,
  labels: ReviewValueLabels,
): string {
  if (field.type === "boolean") {
    if (value === true) return labels.yes;
    if (value === false) return labels.no;
    return labels.empty;
  }
  const formatted = formatAnswer(field, value);
  return formatted === "" ? labels.empty : formatted;
}
