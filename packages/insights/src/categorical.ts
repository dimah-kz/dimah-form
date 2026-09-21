import { fieldOptions, type FormField } from "@dimah-form/core";

export function isCategoricalField(field: FormField): boolean {
  if (field.type === "boolean") return true;
  if (field.type === "select" || field.type === "multiSelect") return true;
  return fieldOptions(field).length > 0;
}

export function optionLabel(
  field: FormField,
  value: string,
): string | undefined {
  const match = fieldOptions(field).find((option) => option.value === value);
  return match?.label;
}

export type CategoricalToken = { value: string; label?: string };

/** Document catalog: boolean Yes/No, otherwise `field.options` in order. */
export function catalogValues(field: FormField): CategoricalToken[] {
  if (field.type === "boolean") {
    return [
      { value: "true", label: "Yes" },
      { value: "false", label: "No" },
    ];
  }
  return fieldOptions(field).map((option) => ({
    value: option.value,
    label: option.label,
  }));
}

/**
 * Keys in `order` keep document order. Unknown keys sort after, via `extra`
 * (default `localeCompare` en).
 */
export function compareByOrder(
  order: readonly string[],
  a: string,
  b: string,
  extra?: (a: string, b: string) => number,
): number {
  const index = new Map(order.map((id, i) => [id, i]));
  const ia = index.get(a);
  const ib = index.get(b);
  if (ia != null && ib != null) return ia - ib;
  if (ia != null) return -1;
  if (ib != null) return 1;
  return extra ? extra(a, b) : a.localeCompare(b, "en");
}

/** Tokens for a visible answered categorical field. multiSelect yields one per item. */
export function categoricalTokens(
  field: FormField,
  value: unknown,
): CategoricalToken[] {
  if (field.type === "boolean") {
    if (value === true) return [{ value: "true", label: "Yes" }];
    if (value === false) return [{ value: "false", label: "No" }];
    return [];
  }
  if (field.type === "multiSelect" && Array.isArray(value)) {
    const tokens: CategoricalToken[] = [];
    for (const item of value) {
      if (typeof item !== "string") continue;
      tokens.push({ value: item, label: optionLabel(field, item) });
    }
    return tokens;
  }
  if (typeof value === "string") {
    return [{ value, label: optionLabel(field, value) }];
  }
  return [];
}
