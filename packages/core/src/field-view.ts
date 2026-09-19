import { isAPIError } from "./error";
import { isFieldVisible } from "./answers";
import type { FieldTypeDefinition } from "./define";
import { createFieldTypeRegistry } from "./field-types";
import type { FormField, DocumentMeta } from "./schema/definition";
import type { FormAnswers } from "./schema/protocol";
import type { ValidationIssue } from "./schema/error";

/** Option list for a select / multiSelect field. `label` falls back to `value`. */
export type FieldOption = {
  value: string;
  label: string;
  meta?: DocumentMeta;
};

/** Visible required fields vs how many of them have a non-empty answer. */
export type FormCompletion = {
  required: number;
  answered: number;
  complete: boolean;
};

function asIssueList(
  source: readonly ValidationIssue[] | unknown,
): ValidationIssue[] {
  const issues = Array.isArray(source)
    ? source
    : isAPIError(source)
      ? (source.issues ?? [])
      : [];
  const next: ValidationIssue[] = [];
  for (const issue of issues) {
    if (
      issue &&
      typeof issue === "object" &&
      typeof issue.field === "string" &&
      typeof issue.message === "string"
    ) {
      next.push(issue as ValidationIssue);
    }
  }
  return next;
}

function resolveViewRegistry(
  fieldTypes:
    | ReadonlyMap<string, FieldTypeDefinition>
    | readonly FieldTypeDefinition[]
    | undefined,
) {
  if (
    fieldTypes &&
    !Array.isArray(fieldTypes) &&
    typeof (fieldTypes as Map<string, FieldTypeDefinition>).get === "function"
  ) {
    return fieldTypes as ReadonlyMap<string, FieldTypeDefinition>;
  }
  return createFieldTypeRegistry(
    fieldTypes as readonly FieldTypeDefinition[] | undefined,
  );
}

function isAnswerEmpty(
  field: FormField,
  value: unknown,
  fieldTypes: ReadonlyMap<string, FieldTypeDefinition>,
) {
  if (value === undefined || value === null) return true;
  return fieldTypes.get(field.type)?.isEmpty?.(value, field) ?? false;
}

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

/** Fields whose `showWhen` matches `answers`. Nested rules follow the sibling. */
export function visibleFields(
  definition: { fields: readonly FormField[] },
  answers: FormAnswers,
): FormField[] {
  return definition.fields.filter((field) =>
    isFieldVisible(field, answers, definition.fields),
  );
}

/** Map `{ field, message }[]` or a `VALIDATION_ERROR` to per-field messages. */
export function issuesByField(
  source: readonly ValidationIssue[] | unknown,
): Record<string, string> {
  const mapped: Record<string, string> = {};
  for (const issue of asIssueList(source)) {
    mapped[issue.field] = issue.message;
  }
  return mapped;
}

/** Last issue per field, including `code` / `params` when present. */
export function fieldIssueMap(
  source: readonly ValidationIssue[] | unknown,
): Record<string, ValidationIssue> {
  const mapped: Record<string, ValidationIssue> = {};
  for (const issue of asIssueList(source)) {
    mapped[issue.field] = issue;
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

/**
 * Coerce an empty input to `null` so a draft patch deletes the key.
 * `""` and `[]` become `null`; other values pass through.
 */
export function emptyToNull(value: string): string | null;
export function emptyToNull(value: unknown): unknown;
export function emptyToNull(value: unknown): unknown {
  if (value === "") return null;
  if (Array.isArray(value) && value.length === 0) return null;
  return value;
}

/**
 * Count visible `required` fields and how many have a non-empty answer.
 * `complete` is true when every visible required field is answered (including
 * when none are required).
 */
export function formCompletion(
  definition: { fields: readonly FormField[] },
  answers: FormAnswers,
  fieldTypes?:
    ReadonlyMap<string, FieldTypeDefinition> | readonly FieldTypeDefinition[],
): FormCompletion {
  const registry = resolveViewRegistry(fieldTypes);
  let required = 0;
  let answered = 0;
  for (const field of visibleFields(definition, answers)) {
    if (field.required !== true) continue;
    required += 1;
    if (!isAnswerEmpty(field, answers[field.id], registry)) answered += 1;
  }
  return { required, answered, complete: answered === required };
}

/**
 * English display string for a builtin answer. Empty / unknown shapes are `""`.
 * Select / multiSelect use option labels. Custom types stringify primitives.
 */
export function formatAnswer(field: FormField, value: unknown): string {
  if (value == null) return "";
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
    return labels.join(", ");
  }
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean" ||
    typeof value === "bigint"
  ) {
    return String(value);
  }
  return "";
}
