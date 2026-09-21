import * as z from "zod";

import {
  defineFieldType,
  type FieldIssueInput,
  type FieldTypeDefinition,
} from "./define";
import { FIELD_ISSUE_CODES } from "./error-codes";
import {
  booleanFieldSchema,
  dateFieldSchema,
  emailFieldSchema,
  fileAnswerSchema,
  fileFieldSchema,
  multiSelectFieldSchema,
  numberFieldSchema,
  selectFieldSchema,
  textFieldSchema,
  type FileAnswer,
} from "./schema/definition";

/** HTML `type="date"` / ISO calendar date (`YYYY-MM-DD`). */
const isoDateAnswer = z.iso.date();
const emailAnswer = z.email();

function asFiniteNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
}

function asBoolean(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

function isBlankString(value: unknown): boolean {
  return typeof value === "string" && value.trim() === "";
}

function issue(
  entry: { code: string; message: string },
  over?: { message?: string; params?: Record<string, string | number> },
): FieldIssueInput {
  return {
    code: entry.code,
    message: over?.message ?? entry.message,
    ...(over?.params ? { params: over.params } : {}),
  };
}

export const textFieldType = defineFieldType({
  type: "text",
  fieldSchema: textFieldSchema,
  isEmpty: (value) => value == null || isBlankString(value),
  validate: (value, field) => {
    if (typeof value !== "string")
      return issue(FIELD_ISSUE_CODES.EXPECTED_STRING);
    const minLength = asFiniteNumber(field.minLength);
    if (minLength !== undefined && value.length < minLength) {
      return issue(FIELD_ISSUE_CODES.TOO_SHORT, {
        message: `Must be at least ${minLength} characters`,
        params: { min: minLength },
      });
    }
    const maxLength = asFiniteNumber(field.maxLength);
    if (maxLength !== undefined && value.length > maxLength) {
      return issue(FIELD_ISSUE_CODES.TOO_LONG, {
        message: `Must be at most ${maxLength} characters`,
        params: { max: maxLength },
      });
    }
    const pattern =
      typeof field.pattern === "string" ? field.pattern : undefined;
    if (pattern) {
      try {
        if (!new RegExp(pattern).test(value)) {
          return issue(FIELD_ISSUE_CODES.INVALID_FORMAT);
        }
      } catch {
        return issue(FIELD_ISSUE_CODES.INVALID_FORMAT);
      }
    }
    return undefined;
  },
  $Infer: "" as string,
});

export const numberFieldType = defineFieldType({
  type: "number",
  fieldSchema: numberFieldSchema,
  isEmpty: (value) => value == null || isBlankString(value),
  validate: (value, field) => {
    if (typeof value !== "number" || !Number.isFinite(value)) {
      return issue(FIELD_ISSUE_CODES.EXPECTED_NUMBER);
    }
    if (asBoolean(field.integer) && !Number.isInteger(value)) {
      return issue(FIELD_ISSUE_CODES.EXPECTED_INTEGER);
    }
    const min = asFiniteNumber(field.min);
    if (min !== undefined && value < min) {
      return issue(FIELD_ISSUE_CODES.TOO_SMALL, {
        message: `Must be at least ${min}`,
        params: { min },
      });
    }
    const max = asFiniteNumber(field.max);
    if (max !== undefined && value > max) {
      return issue(FIELD_ISSUE_CODES.TOO_LARGE, {
        message: `Must be at most ${max}`,
        params: { max },
      });
    }
    return undefined;
  },
  $Infer: 0 as number,
});

export const booleanFieldType = defineFieldType({
  type: "boolean",
  fieldSchema: booleanFieldSchema,
  validate: (value) =>
    typeof value === "boolean"
      ? undefined
      : issue(FIELD_ISSUE_CODES.EXPECTED_BOOLEAN),
  $Infer: false as boolean,
});

function optionValues(field: Record<string, unknown>): Set<string> | undefined {
  const options = field.options;
  if (!Array.isArray(options)) return undefined;
  const allowed = new Set<string>();
  for (const option of options) {
    if (
      option &&
      typeof option === "object" &&
      "value" in option &&
      typeof option.value === "string"
    ) {
      allowed.add(option.value);
    }
  }
  return allowed;
}

export const selectFieldType = defineFieldType({
  type: "select",
  fieldSchema: selectFieldSchema,
  isEmpty: (value) => value == null || isBlankString(value),
  validate: (value, field) => {
    if (typeof value !== "string")
      return issue(FIELD_ISSUE_CODES.EXPECTED_STRING);
    const allowed = optionValues(field);
    if (!allowed) return issue(FIELD_ISSUE_CODES.INVALID_OPTION);
    return allowed.has(value)
      ? undefined
      : issue(FIELD_ISSUE_CODES.INVALID_OPTION);
  },
  $Infer: "" as string,
});

export const multiSelectFieldType = defineFieldType({
  type: "multiSelect",
  fieldSchema: multiSelectFieldSchema,
  isEmpty: (value) =>
    value == null || !Array.isArray(value) || value.length === 0,
  validate: (value, field) => {
    if (
      !Array.isArray(value) ||
      value.some((item) => typeof item !== "string")
    ) {
      return issue(FIELD_ISSUE_CODES.EXPECTED_STRING_ARRAY);
    }
    const allowed = optionValues(field);
    if (!allowed) return issue(FIELD_ISSUE_CODES.INVALID_OPTION);
    const seen = new Set<string>();
    for (const item of value) {
      if (!allowed.has(item)) return issue(FIELD_ISSUE_CODES.INVALID_OPTION);
      if (seen.has(item)) return issue(FIELD_ISSUE_CODES.DUPLICATE_OPTION);
      seen.add(item);
    }
    return undefined;
  },
  $Infer: [] as string[],
});

export const emailFieldType = defineFieldType({
  type: "email",
  fieldSchema: emailFieldSchema,
  isEmpty: (value) => value == null || isBlankString(value),
  validate: (value) => {
    if (typeof value !== "string")
      return issue(FIELD_ISSUE_CODES.EXPECTED_STRING);
    return emailAnswer.validate(value)
      ? undefined
      : issue(FIELD_ISSUE_CODES.EXPECTED_EMAIL);
  },
  $Infer: "" as string,
});

export const dateFieldType = defineFieldType({
  type: "date",
  fieldSchema: dateFieldSchema,
  isEmpty: (value) => value == null || isBlankString(value),
  validate: (value, field = { type: "date" }) => {
    if (typeof value !== "string")
      return issue(FIELD_ISSUE_CODES.EXPECTED_STRING);
    if (!isoDateAnswer.validate(value)) {
      return issue(FIELD_ISSUE_CODES.EXPECTED_DATE);
    }
    const min = typeof field.min === "string" ? field.min : undefined;
    if (min !== undefined && value < min) {
      return issue(FIELD_ISSUE_CODES.TOO_SMALL, {
        message: `Must be on or after ${min}`,
        params: { min },
      });
    }
    const max = typeof field.max === "string" ? field.max : undefined;
    if (max !== undefined && value > max) {
      return issue(FIELD_ISSUE_CODES.TOO_LARGE, {
        message: `Must be on or before ${max}`,
        params: { max },
      });
    }
    return undefined;
  },
  $Infer: "" as string,
});

const BINARY_FILE_KEYS = new Set(["bytes", "data", "content", "buffer"]);

/** Display string for a file answer: name, then url, then id. */
export function formatFileAnswer(value: unknown): string {
  if (!value || typeof value !== "object" || Array.isArray(value)) return "";
  const record = value as Record<string, unknown>;
  for (const key of ["name", "url", "id"] as const) {
    const item = record[key];
    if (typeof item === "string" && item.trim() !== "") return item;
  }
  return "";
}

function fileIdentity(value: unknown): boolean {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  for (const key of ["id", "url", "name"]) {
    const item = record[key];
    if (typeof item === "string" && item.trim() !== "") return true;
  }
  return false;
}

export const fileFieldType = defineFieldType({
  type: "file",
  fieldSchema: fileFieldSchema,
  isEmpty: (value) => value == null || !fileIdentity(value),
  validate: (value) => {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return issue(FIELD_ISSUE_CODES.EXPECTED_FILE);
    }
    for (const key of Object.keys(value)) {
      if (BINARY_FILE_KEYS.has(key)) {
        return issue(FIELD_ISSUE_CODES.EXPECTED_FILE, {
          message: "File answers cannot include inline bytes",
        });
      }
    }
    return fileAnswerSchema.safeParse(value).success
      ? undefined
      : issue(FIELD_ISSUE_CODES.EXPECTED_FILE);
  },
  format: formatFileAnswer,
  $Infer: {} as FileAnswer,
});

export const builtinFieldTypes = [
  textFieldType,
  numberFieldType,
  booleanFieldType,
  selectFieldType,
  multiSelectFieldType,
  emailFieldType,
  dateFieldType,
  fileFieldType,
] as const;

/** Answer types keyed by builtin `type` string, from each type's `$Infer`. */
export type BuiltinAnswerMap = {
  [F in (typeof builtinFieldTypes)[number] as F["type"]]: F extends {
    readonly $Infer: infer A;
  }
    ? A
    : unknown;
};

/** Built-ins plus consumer types. Duplicate `type` strings throw. */
export function createFieldTypeRegistry(
  extra: readonly FieldTypeDefinition[] | undefined = [],
): Map<string, FieldTypeDefinition> {
  const registry = new Map<string, FieldTypeDefinition>();

  for (const fieldType of [...builtinFieldTypes, ...extra]) {
    if (registry.has(fieldType.type)) {
      throw new Error(
        `Duplicate dimah-form field type "${fieldType.type}". Each field type must be unique.`,
      );
    }
    registry.set(fieldType.type, fieldType);
  }

  return registry;
}

export type FieldTypeRegistryInput =
  | ReadonlyMap<string, FieldTypeDefinition>
  | readonly FieldTypeDefinition[]
  | undefined;

/** Prepared Map, extra-type array, or built-ins only. */
export function resolveFieldTypeRegistry(
  fieldTypes: FieldTypeRegistryInput,
): ReadonlyMap<string, FieldTypeDefinition> {
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
