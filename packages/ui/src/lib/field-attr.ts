import type { FormField } from "@dimah-form/react";

export function fieldNumber(
  field: FormField | undefined,
  key: string,
): number | undefined {
  const value = field?.[key];
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
}

export function fieldString(
  field: FormField | undefined,
  key: string,
): string | undefined {
  const value = field?.[key];
  return typeof value === "string" ? value : undefined;
}

export function fieldFlag(field: FormField | undefined, key: string): boolean {
  return field?.[key] === true;
}

/** UI extras live in `meta` — type-specific validation stays on the field. */
export function fieldMetaFlag(
  field: FormField | undefined,
  key: string,
): boolean {
  const meta = field?.meta;
  return Boolean(meta && typeof meta === "object" && meta[key] === true);
}
