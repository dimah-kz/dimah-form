import type { z } from "zod";

import { formDefinitionSchema } from "./schema/definition";
import type { FormStatus } from "./schema/definition";
import type { FormAnswers } from "./schema/protocol";

/** Code-authored form document. Extra keys on the form and fields are allowed. */
export type FormDefinitionInput = {
  title: string;
  fields: readonly ({
    id: string;
    type: string;
    required?: boolean;
    label?: string;
    description?: string;
    defaultValue?: unknown;
    showWhen?: {
      field: string;
      equals?: unknown;
      includes?: unknown;
    };
  } & Record<string, unknown>)[];
  slug?: string;
  status?: FormStatus;
} & Record<string, unknown>;

export type FieldValidateContext = {
  /** All answers in this draft/submit payload (same object being validated). */
  answers: FormAnswers;
};

export type FieldTypeDefinition<
  TType extends string = string,
  TAnswer = unknown,
> = {
  readonly type: TType;
  /**
   * When the answer is present, return an English error or `undefined`.
   * Select (and similar) read extra keys on `field`. `context.answers` is the
   * full payload so types can compare sibling values.
   */
  validate: (
    value: unknown,
    field: { type: TType } & Record<string, unknown>,
    context?: FieldValidateContext,
  ) => string | undefined;
  /**
   * Treat this value as unanswered for required checks and skip type
   * validation. `null` / `undefined` are always empty.
   */
  isEmpty?: (
    value: unknown,
    field: { type: TType } & Record<string, unknown>,
  ) => boolean;
  /**
   * Optional document schema for this type. Applied at `dimahForm()` /
   * `saveForm` — unknown types still round-trip through `defineForm`.
   */
  fieldSchema?: z.ZodType;
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
