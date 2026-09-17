import { isAPIError } from "./error";
import { isFieldVisible } from "./answers";
import type { FormField, DocumentMeta } from "./schema/definition";
import type { FormAnswers } from "./schema/protocol";
import type { ValidationIssue } from "./schema/error";

/** Option list for a select / multiSelect field. `label` falls back to `value`. */
export type FieldOption = {
  value: string;
  label: string;
  meta?: DocumentMeta;
};

/** `label` when set, otherwise the field id. */
export function fieldLabel(field: Pick<FormField, "id" | "label">): string {
  return field.label ?? field.id;
}

/** Safe `options` parse — unknown shapes are skipped. */
export function fieldOptions(field: FormField): FieldOption[] {
  if (!Array.isArray(field.options)) return [];
  const options: FieldOption[] = [];
  for (const option of field.options) {
    if (
      !option ||
      typeof option !== "object" ||
      typeof option.value !== "string"
    ) {
      continue;
    }
    const record = option as {
      value: string;
      label?: unknown;
      meta?: unknown;
    };
    const next: FieldOption = {
      value: record.value,
      label: typeof record.label === "string" ? record.label : record.value,
    };
    if (
      record.meta &&
      typeof record.meta === "object" &&
      !Array.isArray(record.meta)
    ) {
      next.meta = record.meta as DocumentMeta;
    }
    options.push(next);
  }
  return options;
}

/** Fields whose `showWhen` matches `answers`. */
export function visibleFields(
  definition: { fields: readonly FormField[] },
  answers: FormAnswers,
): FormField[] {
  return definition.fields.filter((field) => isFieldVisible(field, answers));
}

/** Map `{ field, message }[]` or a `VALIDATION_ERROR` to per-field messages. */
export function issuesByField(
  source: readonly ValidationIssue[] | unknown,
): Record<string, string> {
  const issues = Array.isArray(source)
    ? source
    : isAPIError(source)
      ? (source.issues ?? [])
      : [];
  const mapped: Record<string, string> = {};
  for (const issue of issues) {
    if (
      issue &&
      typeof issue === "object" &&
      typeof issue.field === "string" &&
      typeof issue.message === "string"
    ) {
      mapped[issue.field] = issue.message;
    }
  }
  return mapped;
}

/** English `APIError.message`, else `Error.message`, else `fallback`. */
export function formErrorMessage(
  error: unknown,
  fallback = "Request failed",
): string {
  if (isAPIError(error) && error.message) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
