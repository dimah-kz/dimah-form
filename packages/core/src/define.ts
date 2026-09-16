import { formDefinitionSchema } from "./schema/definition";

/** Code-authored form document. Extra field keys are allowed. */
export type FormDefinitionInput = {
  title: string;
  fields: readonly ({
    id: string;
    type: string;
    required?: boolean;
    label?: string;
  } & Record<string, unknown>)[];
};

export type FieldTypeDefinition<
  TType extends string = string,
  TAnswer = unknown,
> = {
  readonly type: TType;
  /**
   * When the answer is present, return an English error or `undefined`.
   * Select (and similar) read extra keys on `field`.
   */
  validate: (
    value: unknown,
    field: { type: TType } & Record<string, unknown>,
  ) => string | undefined;
  /** Phantom answer type for `$Infer`. */
  readonly $Infer?: TAnswer;
};

/** Parse a questionnaire document. Unknown field types are allowed here. */
export function defineForm<const T extends FormDefinitionInput>(form: T): T {
  return formDefinitionSchema.parse(form) as T;
}

/** Custom field type — validator + answer shape. Not a UI component. */
export function defineFieldType<const T extends FieldTypeDefinition>(
  fieldType: T,
): T {
  return fieldType;
}
