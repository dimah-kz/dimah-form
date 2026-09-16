import type { FormField } from "@dimah-form/core";

export function fieldLabel(field: FormField) {
  return field.label ?? field.id;
}

export function fieldOptions(field: FormField) {
  if (!Array.isArray(field.options)) return [];
  return field.options.flatMap((option) => {
    if (
      !option ||
      typeof option !== "object" ||
      typeof option.value !== "string"
    ) {
      return [];
    }
    return [
      {
        value: option.value,
        label: typeof option.label === "string" ? option.label : option.value,
      },
    ];
  });
}

export function formatAnswer(field: FormField, value: unknown) {
  if (value == null) return "—";
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
