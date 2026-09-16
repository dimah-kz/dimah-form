import {
  createFieldTypeRegistry,
  type FieldTypeDefinition,
  type FormField,
  type FormSnapshot,
  type ValidationIssue,
} from "@dimah-form/core";

import { errors } from "./errors";

export type AnswerValidationMode = "draft" | "submit";

const builtinRegistry = createFieldTypeRegistry();

function isAbsent(value: unknown): boolean {
  return value === undefined || value === null;
}

function isRequiredPresent(field: FormField, value: unknown): boolean {
  if (isAbsent(value)) return false;
  if (field.type === "text") {
    return typeof value === "string" && value.trim() !== "";
  }
  if (field.type === "multiSelect") {
    return Array.isArray(value) && value.length > 0;
  }
  return true;
}

function typeMessage(
  field: FormField,
  value: unknown,
  fieldTypes: ReadonlyMap<string, FieldTypeDefinition>,
): string | undefined {
  const fieldType = fieldTypes.get(field.type);
  if (!fieldType) return "Unknown field type";
  return fieldType.validate(value, field);
}

export function collectAnswerIssues(
  definition: FormSnapshot,
  answers: Record<string, unknown>,
  mode: AnswerValidationMode,
  fieldTypes: ReadonlyMap<string, FieldTypeDefinition> = builtinRegistry,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const fieldById = new Map(
    definition.fields.map((field) => [field.id, field]),
  );

  for (const key of Object.keys(answers)) {
    const field = fieldById.get(key);
    if (!field) {
      issues.push({ field: key, message: "Unknown field" });
      continue;
    }
    const value = answers[key];
    if (isAbsent(value)) continue;
    const message = typeMessage(field, value, fieldTypes);
    if (message) issues.push({ field: key, message });
  }

  if (mode === "submit") {
    for (const field of definition.fields) {
      if (!field.required) continue;
      const value = answers[field.id];
      if (isAbsent(value) || !isRequiredPresent(field, value)) {
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
    throw errors.validationError(issues);
  }
}

export function parseAnswers(
  definition: FormSnapshot,
  answers: Record<string, unknown>,
  mode: AnswerValidationMode,
  fieldTypes?: ReadonlyMap<string, FieldTypeDefinition>,
): Record<string, unknown> {
  assertAnswers(definition, answers, mode, fieldTypes);

  const next: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(answers)) {
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

export function requireDraft(status: string): void {
  if (status === "submitted") {
    throw errors.conflict();
  }
}
