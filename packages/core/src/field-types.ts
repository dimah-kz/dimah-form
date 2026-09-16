import { defineFieldType, type FieldTypeDefinition } from "./define";

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

export const textFieldType = defineFieldType({
  type: "text",
  isEmpty: (value) => value == null || isBlankString(value),
  validate: (value, field) => {
    if (typeof value !== "string") return "Expected a string";
    const minLength = asFiniteNumber(field.minLength);
    if (minLength !== undefined && value.length < minLength) {
      return `Must be at least ${minLength} characters`;
    }
    const maxLength = asFiniteNumber(field.maxLength);
    if (maxLength !== undefined && value.length > maxLength) {
      return `Must be at most ${maxLength} characters`;
    }
    const pattern =
      typeof field.pattern === "string" ? field.pattern : undefined;
    if (pattern) {
      try {
        if (!new RegExp(pattern).test(value)) return "Invalid format";
      } catch {
        return "Invalid format";
      }
    }
    return undefined;
  },
  $Infer: "" as string,
});

export const numberFieldType = defineFieldType({
  type: "number",
  validate: (value, field) => {
    if (typeof value !== "number" || !Number.isFinite(value)) {
      return "Expected a number";
    }
    if (asBoolean(field.integer) && !Number.isInteger(value)) {
      return "Expected an integer";
    }
    const min = asFiniteNumber(field.min);
    if (min !== undefined && value < min) {
      return `Must be at least ${min}`;
    }
    const max = asFiniteNumber(field.max);
    if (max !== undefined && value > max) {
      return `Must be at most ${max}`;
    }
    return undefined;
  },
  $Infer: 0 as number,
});

export const booleanFieldType = defineFieldType({
  type: "boolean",
  validate: (value) =>
    typeof value === "boolean" ? undefined : "Expected a boolean",
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
  isEmpty: (value) => value == null || isBlankString(value),
  validate: (value, field) => {
    if (typeof value !== "string") return "Expected a string";
    const allowed = optionValues(field);
    if (!allowed) return "Invalid option";
    return allowed.has(value) ? undefined : "Invalid option";
  },
  $Infer: "" as string,
});

export const multiSelectFieldType = defineFieldType({
  type: "multiSelect",
  isEmpty: (value) =>
    value == null || !Array.isArray(value) || value.length === 0,
  validate: (value, field) => {
    if (
      !Array.isArray(value) ||
      value.some((item) => typeof item !== "string")
    ) {
      return "Expected an array of strings";
    }
    const allowed = optionValues(field);
    if (!allowed) return "Invalid option";
    const seen = new Set<string>();
    for (const item of value) {
      if (!allowed.has(item)) return "Invalid option";
      if (seen.has(item)) return "Duplicate option";
      seen.add(item);
    }
    return undefined;
  },
  $Infer: [] as string[],
});

export const builtinFieldTypes = [
  textFieldType,
  numberFieldType,
  booleanFieldType,
  selectFieldType,
  multiSelectFieldType,
] as const;

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
