import { fieldOptions, type FormField } from "@dimah-form/core";

export function ratingMax(field: FormField) {
  return typeof field.max === "number" &&
    Number.isInteger(field.max) &&
    field.max > 0
    ? field.max
    : 5;
}

export function formatAnswer(field: FormField, value: unknown) {
  if (value == null) return "—";
  if (field.type === "boolean") return value === true ? "Yes" : "No";
  if (field.type === "rating" && typeof value === "number") {
    const max = ratingMax(field);
    const filled = Math.min(Math.max(value, 0), max);
    return `${"★".repeat(filled)}${"☆".repeat(max - filled)}`;
  }
  const options = fieldOptions(field);
  if (field.type === "select" && typeof value === "string") {
    return options.find((option) => option.value === value)?.label ?? value;
  }
  if (field.type === "multiSelect" && Array.isArray(value)) {
    const labels = value
      .filter((item): item is string => typeof item === "string")
      .map(
        (item) =>
          options.find((option) => option.value === item)?.label ?? item,
      );
    return labels.length ? labels.join(", ") : "—";
  }
  return String(value);
}
