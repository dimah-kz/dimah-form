import type { FieldTypeDefinition } from "./define";
import type { BuiltinAnswerMap } from "./field-types";
import type { FormAnswers } from "./schema/protocol";

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

type HasShowWhen<F> = F extends { showWhen: unknown } ? true : false;

/** Required in the document and always visible — present on submit. */
type RequiredField<F> = F extends { required: true }
  ? HasShowWhen<F> extends true
    ? never
    : F
  : never;

/** Optional in the document, or required only when `showWhen` matches. */
type OptionalField<F> = F extends { required: true }
  ? HasShowWhen<F> extends true
    ? F
    : never
  : F;

type OptionValue<O> = O extends { readonly value: infer V extends string }
  ? V
  : never;

type InferSelectValues<Options> = Options extends readonly (infer O)[]
  ? OptionValue<O> extends never
    ? string
    : OptionValue<O>
  : string;

type AnswerOf<
  F,
  TFieldTypes extends readonly FieldTypeDefinition[],
> = F extends { type: "select"; options: infer Options }
  ? InferSelectValues<Options>
  : F extends { type: "multiSelect"; options: infer Options }
    ? InferSelectValues<Options>[]
    : F extends { type: infer Type extends string }
      ? InferFieldAnswer<Type, TFieldTypes>
      : unknown;

type Flatten<T> = { [K in keyof T]: T[K] } & {};

/**
 * Submitted answer shape for one code-authored form.
 * Optional fields — and required fields with `showWhen` — are omitted keys.
 * That is the same object `parseAnswers` returns.
 * Select / multiSelect values are literal unions of `options[].value`.
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

/**
 * Answers for one catalog key on a typed client or server `$Infer`.
 *
 * @example
 * ```ts
 * type Intake = InferClientFormAnswers<typeof formClient, "intake">;
 * const q = useFormResponse<Intake>({ snapshot });
 * // Bound hook: useFormResponse<"intake">({ snapshot })
 * ```
 */
export type InferClientFormAnswers<
  TClient extends { readonly $Infer: { readonly answers: unknown } },
  K extends keyof TClient["$Infer"]["answers"],
> = TClient["$Infer"]["answers"][K] extends FormAnswers
  ? TClient["$Infer"]["answers"][K]
  : FormAnswers;
