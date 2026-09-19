import {
  formatAnswer as formatBuiltinAnswer,
  type FormField,
} from "@dimah-form/core";

function ratingMax(field: FormField) {
  return typeof field.max === "number" &&
    Number.isInteger(field.max) &&
    field.max > 0
    ? field.max
    : 5;
}

export function formatAnswer(field: FormField, value: unknown) {
  if (field.type === "rating" && typeof value === "number") {
    const max = ratingMax(field);
    const filled = Math.min(Math.max(value, 0), max);
    return `${"★".repeat(filled)}${"☆".repeat(max - filled)}`;
  }
  const formatted = formatBuiltinAnswer(field, value);
  return formatted === "" ? "—" : formatted;
}
