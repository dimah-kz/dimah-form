import type {
  FormField,
  FormSnapshot,
  ValidationIssue,
} from "@dimah-form/core";

import { errors } from "./errors";

export type AnswerValidationMode = "draft" | "submit";

function isAbsent(value: unknown): boolean {
  return value === undefined || value === null;
}

function isRequiredPresent(field: FormField, value: unknown): boolean {
  if (isAbsent(value)) return false;
  if (field.type === "text") {
    return typeof value === "string" && value.trim() !== "";
  }
  return true;
}

function typeMessage(field: FormField, value: unknown): string | undefined {
  switch (field.type) {
    case "text":
      return typeof value === "string" ? undefined : "Expected a string";
    case "number":
      return typeof value === "number" && Number.isFinite(value)
        ? undefined
        : "Expected a number";
    case "boolean":
      return typeof value === "boolean" ? undefined : "Expected a boolean";
    case "select": {
      if (typeof value !== "string") return "Expected a string";
      const allowed = new Set(field.options.map((option) => option.value));
      return allowed.has(value) ? undefined : "Invalid option";
    }
    default:
      return "Unknown field type";
  }
}

export function collectAnswerIssues(
  definition: FormSnapshot,
  answers: Record<string, unknown>,
  mode: AnswerValidationMode,
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
    const message = typeMessage(field, value);
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

export function parseAnswers(
  definition: FormSnapshot,
  answers: Record<string, unknown>,
  mode: AnswerValidationMode,
): Record<string, unknown> {
  const issues = collectAnswerIssues(definition, answers, mode);
  if (issues.length > 0) {
    throw errors.validationError(issues);
  }

  const next: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(answers)) {
    if (isAbsent(value)) continue;
    next[key] = value;
  }
  return next;
}

export function requireDraft(status: string): void {
  if (status === "submitted") {
    throw errors.conflict();
  }
}
