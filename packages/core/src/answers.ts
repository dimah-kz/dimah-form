import type { FieldIssueInput, FieldTypeDefinition } from "./define";
import { APIError } from "./error";
import { FIELD_ISSUE_CODES, FORM_ERROR_CODES } from "./error-codes";
import { createFieldTypeRegistry } from "./field-types";
import { awaitMaybe, isThenable, type MaybePromise } from "./maybe-promise";
import type { FormField, FormSnapshot } from "./schema/definition";
import type { ValidationIssue } from "./schema/error";
import type { FormAnswers } from "./schema/protocol";
import { isFieldVisible } from "./show-when";

export type AnswerValidationMode = "draft" | "submit";

export { isFieldVisible };

/**
 * Extra checks after per-field validators. Return `{ field, message, code? }`
 * issues. Runs on the same snapshot as field validation (client and server).
 * May be async (uniqueness, lookups).
 */
export type AnswersValidator = (
  definition: FormSnapshot,
  answers: FormAnswers,
  mode: AnswerValidationMode,
) => MaybePromise<ValidationIssue[] | void>;

const builtinRegistry = createFieldTypeRegistry();

function isAbsent(value: unknown): boolean {
  return value === undefined || value === null;
}

function toValidationIssue(
  field: string,
  result: string | FieldIssueInput,
): ValidationIssue {
  if (typeof result === "string") {
    return {
      field,
      message: result,
      code: FIELD_ISSUE_CODES.INVALID.code,
    };
  }
  return {
    field,
    message: result.message,
    code: result.code ?? FIELD_ISSUE_CODES.INVALID.code,
    ...(result.params ? { params: result.params } : {}),
  };
}

/**
 * Drop answers for fields hidden by `showWhen`. Unknown keys are kept so
 * submit can still reject them. Nested rules follow the sibling's visibility.
 */
export function stripHiddenAnswers(
  definition: { fields: readonly FormField[] },
  answers: Record<string, unknown>,
): Record<string, unknown> {
  const fieldById = new Map(
    definition.fields.map((field) => [field.id, field]),
  );
  const next: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(answers)) {
    const field = fieldById.get(key);
    if (field && !isFieldVisible(field, answers, definition.fields)) {
      continue;
    }
    next[key] = value;
  }
  return next;
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

/** Missing, or the field type's `isEmpty` (blank text, empty multiSelect, …). */
export function isAnswerEmpty(
  field: FormField,
  value: unknown,
  fieldTypes: ReadonlyMap<string, FieldTypeDefinition>,
): boolean {
  if (isAbsent(value)) return true;
  return fieldTypes.get(field.type)?.isEmpty?.(value, field) ?? false;
}

function appendExtraIssues(
  issues: ValidationIssue[],
  extra: ValidationIssue[] | void,
) {
  if (!extra) return issues;
  for (const item of extra) {
    issues.push({
      field: item.field,
      message: item.message,
      code: item.code ?? FIELD_ISSUE_CODES.INVALID.code,
      ...(item.params ? { params: item.params } : {}),
    });
  }
  return issues;
}

function addRequiredIssues(
  definition: FormSnapshot,
  visible: Record<string, unknown>,
  fieldTypes: ReadonlyMap<string, FieldTypeDefinition>,
  issues: ValidationIssue[],
) {
  for (const field of definition.fields) {
    if (!field.required) continue;
    if (!isFieldVisible(field, visible, definition.fields)) continue;
    const value = visible[field.id];
    if (isAnswerEmpty(field, value, fieldTypes)) {
      const alreadyTyped = issues.some((item) => item.field === field.id);
      if (!alreadyTyped) {
        issues.push({ field: field.id, ...FIELD_ISSUE_CODES.REQUIRED });
      }
    }
  }
}

function collectFieldIssues(
  definition: FormSnapshot,
  visible: Record<string, unknown>,
  fieldTypes: ReadonlyMap<string, FieldTypeDefinition>,
): { issues: ValidationIssue[]; pending: Promise<void>[] } {
  const issues: ValidationIssue[] = [];
  const pending: Promise<void>[] = [];
  const fieldById = new Map(
    definition.fields.map((field) => [field.id, field]),
  );

  for (const key of Object.keys(visible)) {
    const field = fieldById.get(key);
    if (!field) {
      issues.push({ field: key, ...FIELD_ISSUE_CODES.UNKNOWN_FIELD });
      continue;
    }
    const value = visible[key];
    if (isAnswerEmpty(field, value, fieldTypes)) continue;
    const fieldType = fieldTypes.get(field.type);
    if (!fieldType) {
      issues.push({
        field: field.id,
        ...FIELD_ISSUE_CODES.UNKNOWN_FIELD_TYPE,
      });
      continue;
    }
    const result = fieldType.validate(value, field, { answers: visible });
    if (result === undefined) continue;
    if (isThenable(result)) {
      pending.push(
        result.then((resolved) => {
          if (resolved !== undefined) {
            issues.push(toValidationIssue(field.id, resolved));
          }
        }),
      );
      continue;
    }
    issues.push(toValidationIssue(field.id, result));
  }

  return { issues, pending };
}

export function collectAnswerIssues(
  definition: FormSnapshot,
  answers: Record<string, unknown>,
  mode: AnswerValidationMode,
  fieldTypes: ReadonlyMap<string, FieldTypeDefinition> = builtinRegistry,
  validateAnswers?: AnswersValidator,
): MaybePromise<ValidationIssue[]> {
  const visible = stripHiddenAnswers(definition, answers);
  const { issues, pending } = collectFieldIssues(
    definition,
    visible,
    fieldTypes,
  );

  const extra = validateAnswers?.(definition, visible, mode);

  function finish(resolvedExtra: ValidationIssue[] | void) {
    if (mode === "submit") {
      addRequiredIssues(definition, visible, fieldTypes, issues);
    }
    return appendExtraIssues(issues, resolvedExtra);
  }

  if (pending.length === 0 && !isThenable(extra)) {
    return finish(extra);
  }

  return Promise.all(pending)
    .then(() => awaitMaybe(extra))
    .then((resolved) => finish(resolved));
}

export async function assertAnswers(
  definition: FormSnapshot,
  answers: Record<string, unknown>,
  mode: AnswerValidationMode,
  fieldTypes?: ReadonlyMap<string, FieldTypeDefinition>,
  validateAnswers?: AnswersValidator,
): Promise<void> {
  const issues = await awaitMaybe(
    collectAnswerIssues(definition, answers, mode, fieldTypes, validateAnswers),
  );
  if (issues.length > 0) {
    throw APIError.from("BAD_REQUEST", {
      ...FORM_ERROR_CODES.VALIDATION_ERROR,
      issues,
    });
  }
}

/**
 * Strip hidden fields, validate, and drop empty keys (`null` / `undefined`,
 * blank text, empty multiSelect — whatever the field type treats as empty).
 * Throws {@link APIError} `VALIDATION_ERROR` when issues remain.
 */
export async function parseAnswers(
  definition: FormSnapshot,
  answers: Record<string, unknown>,
  mode: AnswerValidationMode,
  fieldTypes?: ReadonlyMap<string, FieldTypeDefinition>,
  validateAnswers?: AnswersValidator,
): Promise<Record<string, unknown>> {
  const types = fieldTypes ?? builtinRegistry;
  const visible = stripHiddenAnswers(definition, answers);
  await assertAnswers(definition, visible, mode, types, validateAnswers);

  const fieldById = new Map(
    definition.fields.map((field) => [field.id, field]),
  );
  const next: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(visible)) {
    const field = fieldById.get(key);
    if (field ? isAnswerEmpty(field, value, types) : isAbsent(value)) {
      continue;
    }
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
