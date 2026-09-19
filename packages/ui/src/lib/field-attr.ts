import type { FormField, FormFieldBinding } from "@dimah-form/react";

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

function fieldMeta(field: FormField | undefined) {
  const meta = field?.meta;
  if (!meta || typeof meta !== "object" || Array.isArray(meta))
    return undefined;
  return meta;
}

/** UI extras live in `meta` — type-specific validation stays on the field. */
export function fieldMetaFlag(
  field: FormField | undefined,
  key: string,
): boolean {
  return fieldMeta(field)?.[key] === true;
}

export function fieldMetaString(
  field: FormField | undefined,
  key: string,
): string | undefined {
  const value = fieldMeta(field)?.[key];
  return typeof value === "string" && value.trim() !== ""
    ? value.trim()
    : undefined;
}

export function fieldMetaNumber(
  field: FormField | undefined,
  key: string,
): number | undefined {
  const value = fieldMeta(field)?.[key];
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
}

/**
 * Presentation hint on `meta.widget`. Built-ins: `radio` (select),
 * `switch` (boolean), `chips` (multiSelect).
 */
export function fieldWidget(field: FormField | undefined): string | undefined {
  return fieldMetaString(field, "widget");
}

export function fieldDescriptionId(id: string) {
  return `${id}-description`;
}

export function fieldHelpId(id: string) {
  return `${id}-help`;
}

export function fieldErrorId(id: string) {
  return `${id}-error`;
}

function hasDescription(field: FormField | undefined) {
  return typeof field?.description === "string" && field.description.length > 0;
}

function defaultAutoComplete(field: FormField | undefined): string | undefined {
  const fromMeta = fieldMetaString(field, "autocomplete");
  if (fromMeta) return fromMeta;
  if (field?.type === "email") return "email";
  return undefined;
}

function defaultInputMode(field: FormField | undefined): string | undefined {
  const fromMeta = fieldMetaString(field, "inputMode");
  if (fromMeta) return fromMeta;
  if (field?.type === "email") return "email";
  if (field?.type === "number") {
    return fieldFlag(field, "integer") ? "numeric" : "decimal";
  }
  return undefined;
}

/** Native control attributes derived from a binding. */
export function fieldControlProps(binding: FormFieldBinding) {
  const field = binding.field;
  const id = field?.id ?? binding.id;
  const describedBy = [
    hasDescription(field) ? fieldDescriptionId(id) : undefined,
    fieldMetaString(field, "help") ? fieldHelpId(id) : undefined,
    binding.invalid ? fieldErrorId(id) : undefined,
  ]
    .filter((value): value is string => Boolean(value))
    .join(" ");

  const autoComplete = defaultAutoComplete(field);
  const inputMode = defaultInputMode(field);
  const pattern =
    field?.type === "text" || field?.type === "email"
      ? fieldString(field, "pattern")
      : undefined;

  return {
    id,
    name: id,
    disabled: binding.disabled,
    "aria-invalid": binding.invalid || undefined,
    "aria-required": binding.required || undefined,
    "aria-describedby": describedBy || undefined,
    ...(autoComplete ? { autoComplete } : {}),
    ...(inputMode ? { inputMode: inputMode as never } : {}),
    ...(pattern ? { pattern } : {}),
  };
}
