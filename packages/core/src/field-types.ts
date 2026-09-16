import { defineFieldType, type FieldTypeDefinition } from "./define";

export const textFieldType = defineFieldType({
  type: "text",
  validate: (value) =>
    typeof value === "string" ? undefined : "Expected a string",
  $Infer: "" as string,
});

export const numberFieldType = defineFieldType({
  type: "number",
  validate: (value) =>
    typeof value === "number" && Number.isFinite(value)
      ? undefined
      : "Expected a number",
  $Infer: 0 as number,
});

export const booleanFieldType = defineFieldType({
  type: "boolean",
  validate: (value) =>
    typeof value === "boolean" ? undefined : "Expected a boolean",
  $Infer: false as boolean,
});

export const selectFieldType = defineFieldType({
  type: "select",
  validate: (value, field) => {
    if (typeof value !== "string") return "Expected a string";
    const options = field.options;
    if (!Array.isArray(options)) return "Invalid option";
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
    return allowed.has(value) ? undefined : "Invalid option";
  },
  $Infer: "" as string,
});

export const builtinFieldTypes = [
  textFieldType,
  numberFieldType,
  booleanFieldType,
  selectFieldType,
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
