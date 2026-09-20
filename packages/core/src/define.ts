import type { z } from "zod";

import type { MaybePromise } from "./maybe-promise";
import {
  formDefinitionSchema,
  type DocumentMeta,
  type FieldShowWhen,
  type FormStatus,
} from "./schema/definition";
import type { FormAnswers } from "./schema/protocol";

/** Code-authored form document. Type-specific keys stay on the field; UI extras go in `meta`. */
export type FormDefinitionInput = {
  title: string;
  description?: string;
  fields: readonly ({
    id: string;
    type: string;
    required?: boolean;
    label?: string;
    description?: string;
    defaultValue?: unknown;
    showWhen?: FieldShowWhen;
    meta?: DocumentMeta;
  } & Record<string, unknown>)[];
  slug?: string;
  status?: FormStatus;
  meta?: DocumentMeta;
};

export type FieldValidateContext = {
  /** All answers in this draft/submit payload (same object being validated). */
  answers: FormAnswers;
};

/** Object form of a field validator result. A plain string is also accepted. */
export type FieldIssueInput = {
  message: string;
  code?: string;
  params?: Record<string, string | number>;
};

export type FieldValidateResult = string | FieldIssueInput;

export type FieldTypeDefinition<
  TType extends string = string,
  TAnswer = unknown,
> = {
  readonly type: TType;
  /**
   * When the answer is present, return an English error or `undefined`.
   * A string is treated as `{ message, code: "INVALID" }`. Prefer
   * `{ message, code, params? }` so the UI can localize from `code`.
   * Select (and similar) read type-specific keys on `field`. `context.answers`
   * is the full payload so types can compare sibling values.
   */
  validate: (
    value: unknown,
    field: { type: TType } & Record<string, unknown>,
    context?: FieldValidateContext,
  ) => MaybePromise<FieldValidateResult | undefined>;
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
  /**
   * English display string for a stored answer. Same rule as `validate`
   * messages — the UI may localize. `formatAnswer` prefers this over the
   * builtin switch.
   */
  format?: (
    value: unknown,
    field: { type: TType } & Record<string, unknown>,
  ) => string;
  /** Phantom answer type for `$Infer`. */
  readonly $Infer?: TAnswer;
};

/** Parse a questionnaire document. Unknown field types are allowed here. */
export function defineForm<const T extends FormDefinitionInput>(form: T): T {
  return formDefinitionSchema.parse(form) as unknown as T;
}

/** Custom field type — validator, optional display `format`, and answer shape. Not a UI component. */
export function defineFieldType<const T extends FieldTypeDefinition>(
  fieldType: T,
): T {
  return fieldType;
}
