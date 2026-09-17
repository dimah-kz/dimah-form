import type { FieldTypeDefinition } from "./define";
import type { BuiltinAnswerMap } from "./field-types";

type InferFieldAnswer<
  TType extends string,
  TFieldTypes extends readonly FieldTypeDefinition[],
> = [Extract<TFieldTypes[number], { type: TType }>] extends [never]
  ? TType extends keyof BuiltinAnswerMap
    ? BuiltinAnswerMap[TType]
    : unknown
  : Extract<TFieldTypes[number], { type: TType }> extends { $Infer: infer A }
    ? A
    : unknown;

type FieldOf<TForm> = TForm extends { fields: readonly (infer F)[] }
  ? F
  : never;

type FieldId<F> = F extends { id: infer Id extends string } ? Id : never;

type RequiredField<F> = F extends { required: true } ? F : never;
type OptionalField<F> = F extends { required: true } ? never : F;

type AnswerOf<
  F,
  TFieldTypes extends readonly FieldTypeDefinition[],
> = F extends {
  type: infer Type extends string;
}
  ? InferFieldAnswer<Type, TFieldTypes>
  : unknown;

type Flatten<T> = { [K in keyof T]: T[K] } & {};

/**
 * Submitted answer shape for one code-authored form.
 * Optional fields are omitted keys — the same object `parseAnswers` returns.
 */
export type InferFormAnswers<
  TForm,
  TFieldTypes extends readonly FieldTypeDefinition[] = [],
> = Flatten<
  {
    [F in RequiredField<FieldOf<TForm>> as FieldId<F>]: AnswerOf<
      F,
      TFieldTypes
    >;
  } & {
    [F in OptionalField<FieldOf<TForm>> as FieldId<F>]?: AnswerOf<
      F,
      TFieldTypes
    >;
  }
>;

/** `$Infer.answers` map keyed by `forms` record keys. */
export type InferAnswersMap<
  TForms extends Record<string, unknown>,
  TFieldTypes extends readonly FieldTypeDefinition[] = [],
> = {
  [K in keyof TForms]: InferFormAnswers<TForms[K], TFieldTypes>;
};
