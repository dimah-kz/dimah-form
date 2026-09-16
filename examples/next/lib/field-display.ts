import type { FormField } from "@dimah-form/core";

export function fieldLabel(field: FormField) {
  return typeof field.label === "string" ? field.label : field.id;
}

export function fieldOptions(field: FormField) {
  const options = field.options;
  if (!Array.isArray(options)) return [];
  return options.flatMap((option) => {
    if (!option || typeof option !== "object" || !("value" in option)) {
      return [];
    }
    const value = option.value;
    if (typeof value !== "string") return [];
    const label =
      "label" in option && typeof option.label === "string"
        ? option.label
        : value;
    return [{ value, label }];
  });
}

export function formatAnswer(field: FormField, value: unknown) {
  if (value === undefined || value === null) return "—";
  if (field.type === "boolean") return value === true ? "Yes" : "No";
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
