import { formDefinitionSchema, type FormDefinition } from "./schema/definition";

/** Parse and freeze a code-authored questionnaire document. */
export function defineForm(form: FormDefinition): FormDefinition {
  return formDefinitionSchema.parse(form);
}

/** Custom field type — validator + answer shape. Not a UI component. */
export function defineFieldType<const T extends { type: string }>(
  fieldType: T,
): T {
  return fieldType;
}
