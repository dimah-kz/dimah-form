import type { FieldTypeDefinition } from "./define";

type BuiltinAnswerMap = {
  text: string;
  number: number;
  boolean: boolean;
  select: string;
  multiSelect: string[];
};

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

/** Submitted answer shape for one code-authored form. */
export type InferFormAnswers<
  TForm,
  TFieldTypes extends readonly FieldTypeDefinition[] = [],
> = {
  [
    F in FieldOf<TForm> as F extends { id: infer Id extends string }
      ? Id
      : never
  ]: F extends { type: infer Type extends string }
    ? F extends { required: true }
      ? InferFieldAnswer<Type, TFieldTypes>
      : InferFieldAnswer<Type, TFieldTypes> | undefined
    : unknown;
};

/** `$Infer.answers` map keyed by `forms` record keys. */
export type InferAnswersMap<
  TForms extends Record<string, unknown>,
  TFieldTypes extends readonly FieldTypeDefinition[] = [],
> = {
  [K in keyof TForms]: InferFormAnswers<TForms[K], TFieldTypes>;
};
