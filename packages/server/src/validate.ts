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
    if (isValueEmpty(field, value, fieldTypes)) continue;
    const message = typeMessage(field, value, answers, fieldTypes);
    if (message) issues.push({ field: key, message });
  }

  if (mode === "submit") {
    for (const field of definition.fields) {
      if (!field.required) continue;
      const value = answers[field.id];
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

/** Draft-only mutations. Submitted and abandoned rows are locked. */
export function requireDraft(status: string): void {
  if (status !== "draft") {
    throw errors.conflict();
  }
}

export function assertFresh(
  existing: { updatedAt: string },
  expected?: string,
): void {
  if (expected !== undefined && expected !== existing.updatedAt) {
    throw errors.staleUpdate();
  }
}
