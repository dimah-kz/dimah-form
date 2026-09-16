import { APIError } from "./error";
import { FORM_ERROR_CODES } from "./error-codes";
import type { FieldTypeDefinition } from "./define";
import { createFieldTypeRegistry } from "./field-types";
import type { FormField, FormSnapshot } from "./schema/definition";
import type { ValidationIssue } from "./schema/error";

export type AnswerValidationMode = "draft" | "submit";

const builtinRegistry = createFieldTypeRegistry();

function isAbsent(value: unknown): boolean {
  return value === undefined || value === null;
}

function asShowWhen(value: unknown):
  | {
      field: string;
      equals?: unknown;
      includes?: unknown;
    }
  | undefined {
  if (value == null || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }
  const record = value as Record<string, unknown>;
  if (typeof record.field !== "string") return undefined;
  return {
    field: record.field,
    ...(record.equals !== undefined ? { equals: record.equals } : {}),
    ...(record.includes !== undefined ? { includes: record.includes } : {}),
  };
}

function siblingMatchesIncludes(sibling: unknown, expected: unknown): boolean {
  return (
    Array.isArray(sibling) && sibling.some((item) => Object.is(item, expected))
  );
}

/** True when `showWhen` is absent or the sibling answer matches. */
export function isFieldVisible(
  field: FormField,
  answers: Record<string, unknown>,
): boolean {
  const rule = asShowWhen(field.showWhen);
  if (!rule) return true;
  const sibling = answers[rule.field];
  if (rule.equals !== undefined && !Object.is(sibling, rule.equals)) {
    return false;
  }
  if (
    rule.includes !== undefined &&
    !siblingMatchesIncludes(sibling, rule.includes)
  ) {
    return false;
  }
  return true;
}

/**
 * Drop answers for fields hidden by `showWhen`. Unknown keys are kept so
 * submit can still reject them. Re-evaluates until the set is stable.
 */
export function stripHiddenAnswers(
  definition: { fields: readonly FormField[] },
  answers: Record<string, unknown>,
): Record<string, unknown> {
  const fieldById = new Map(
    definition.fields.map((field) => [field.id, field]),
  );
  let current = { ...answers };
  for (let pass = 0; pass <= definition.fields.length; pass++) {
    const next: Record<string, unknown> = {};
    let removed = false;
    for (const [key, value] of Object.entries(current)) {
      const field = fieldById.get(key);
      if (field && !isFieldVisible(field, current)) {
        removed = true;
        continue;
      }
      next[key] = value;
    }
    current = next;
    if (!removed) break;
  }
  return current;
}

/** Seed start answers from `defaultValue`, then drop hidden fields. */
export function seedDefaultAnswers(definition: {
  fields: readonly FormField[];
}): Record<string, unknown> {
  const seeded: Record<string, unknown> = {};
  for (const field of definition.fields) {
    if (field.defaultValue === undefined || field.defaultValue === null) {
      continue;
    }
    seeded[field.id] = field.defaultValue;
  }
  return stripHiddenAnswers(definition, seeded);
}

function isValueEmpty(
  field: FormField,
  value: unknown,
  fieldTypes: ReadonlyMap<string, FieldTypeDefinition>,
): boolean {
  if (isAbsent(value)) return true;
  return fieldTypes.get(field.type)?.isEmpty?.(value, field) ?? false;
}

function typeMessage(
  field: FormField,
  value: unknown,
  answers: Record<string, unknown>,
  fieldTypes: ReadonlyMap<string, FieldTypeDefinition>,
): string | undefined {
  const fieldType = fieldTypes.get(field.type);
  if (!fieldType) return "Unknown field type";
  return fieldType.validate(value, field, { answers });
}

export function collectAnswerIssues(
  definition: FormSnapshot,
  answers: Record<string, unknown>,
  mode: AnswerValidationMode,
  fieldTypes: ReadonlyMap<string, FieldTypeDefinition> = builtinRegistry,
): ValidationIssue[] {
  const visible = stripHiddenAnswers(definition, answers);
  const issues: ValidationIssue[] = [];
  const fieldById = new Map(
    definition.fields.map((field) => [field.id, field]),
  );

  for (const key of Object.keys(visible)) {
    const field = fieldById.get(key);
    if (!field) {
      issues.push({ field: key, message: "Unknown field" });
      continue;
    }
    const value = visible[key];
    if (isValueEmpty(field, value, fieldTypes)) continue;
    const message = typeMessage(field, value, visible, fieldTypes);
    if (message) issues.push({ field: key, message });
  }

  if (mode === "submit") {
    for (const field of definition.fields) {
      if (!field.required) continue;
      if (!isFieldVisible(field, visible)) continue;
      const value = visible[field.id];
      if (isValueEmpty(field, value, fieldTypes)) {
        const alreadyTyped = issues.some((issue) => issue.field === field.id);
        if (!alreadyTyped) {
          issues.push({ field: field.id, message: "Required" });
        }
      }
    }
  }

  return issues;
}

export function assertAnswers(
  definition: FormSnapshot,
  answers: Record<string, unknown>,
  mode: AnswerValidationMode,
  fieldTypes?: ReadonlyMap<string, FieldTypeDefinition>,
): void {
  const issues = collectAnswerIssues(definition, answers, mode, fieldTypes);
  if (issues.length > 0) {
    throw APIError.from("BAD_REQUEST", {
      ...FORM_ERROR_CODES.VALIDATION_ERROR,
      issues,
    });
  }
}

/**
 * Strip hidden fields, validate, and drop `null` / `undefined` keys.
 * Throws {@link APIError} `VALIDATION_ERROR` when issues remain.
 */
export function parseAnswers(
  definition: FormSnapshot,
  answers: Record<string, unknown>,
  mode: AnswerValidationMode,
  fieldTypes?: ReadonlyMap<string, FieldTypeDefinition>,
): Record<string, unknown> {
  const visible = stripHiddenAnswers(definition, answers);
  assertAnswers(definition, visible, mode, fieldTypes);

  const next: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(visible)) {
    if (isAbsent(value)) continue;
    next[key] = value;
  }
  return next;
}

/** Merge a draft patch into stored answers. `null` / `undefined` deletes a key. */
export function applyAnswerPatch(
  existing: Record<string, unknown>,
  patch: Record<string, unknown>,
): Record<string, unknown> {
  const next = { ...existing };
  for (const [key, value] of Object.entries(patch)) {
    if (isAbsent(value)) {
      delete next[key];
    } else {
      next[key] = value;
    }
  }
  return next;
}
