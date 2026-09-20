import type { FieldTypeDefinition } from "./define";
import type {
  DocumentMeta,
  FieldShowWhen,
  FormStatus,
} from "./schema/definition";

/** `meta` bags on an authored form / field / option. */
export type FormDefinitionMeta = {
  form?: unknown;
  field?: unknown;
  option?: unknown;
};

/** Opaque JSON bags — same as the protocol `meta` object. */
export type FormDefinitionMetaDefault = {
  form: DocumentMeta;
  field: DocumentMeta;
  option: DocumentMeta;
};

export type BuiltinFieldTypeName =
  "text" | "number" | "boolean" | "select" | "multiSelect" | "email" | "date";

type FieldMetaOf<T extends FormDefinitionMeta> = T extends { field: infer M }
  ? M
  : DocumentMeta;

type FormMetaOf<T extends FormDefinitionMeta> = T extends { form: infer M }
  ? M
  : DocumentMeta;

type OptionMetaOf<T extends FormDefinitionMeta> = T extends { option: infer M }
  ? M
  : DocumentMeta;

type AuthorOption<TOptionMeta> = {
  value: string;
  label?: string;
  meta?: TOptionMeta;
};

type AuthorFieldBase<TFieldMeta> = {
  id: string;
  required?: boolean;
  label?: string;
  description?: string;
  defaultValue?: unknown;
  showWhen?: FieldShowWhen;
  meta?: TFieldMeta;
};

type Flatten<T> = { [K in keyof T]: T[K] } & {};

type InferZodInput<S> =
  NonNullable<S> extends { _input: infer I }
    ? I
    : NonNullable<S> extends { _zod: { input: infer I } }
      ? I
      : unknown;

/** Drop `[x: string]` from Zod `looseObject` so known keys stay specific. */
type StripIndex<T> = {
  [
    K in keyof T as string extends K ? never : number extends K ? never : K
  ]: T[K];
};

type SharedAuthorKeys =
  | "id"
  | "type"
  | "required"
  | "label"
  | "description"
  | "defaultValue"
  | "showWhen"
  | "meta"
  | "options";

type SchemaExtras<S> =
  InferZodInput<S> extends infer I
    ? unknown extends I
      ? Record<string, unknown>
      : Omit<StripIndex<I>, SharedAuthorKeys>
    : Record<string, unknown>;

type SchemaOptions<S, TOptionMeta> =
  InferZodInput<S> extends {
    options: infer _O;
  }
    ? { options: readonly AuthorOption<TOptionMeta>[] }
    : unknown;

type CustomAuthorField<F, TMeta extends FormDefinitionMeta> = F extends {
  readonly type: infer TType extends string;
}
  ? F extends { fieldSchema: infer S }
    ? AuthorFieldBase<FieldMetaOf<TMeta>> & {
        type: TType;
      } & SchemaExtras<S> &
        SchemaOptions<S, OptionMetaOf<TMeta>>
    : AuthorFieldBase<FieldMetaOf<TMeta>> & {
        type: TType;
      } & Record<string, unknown>
  : never;

type BuiltinAuthorFields<TMeta extends FormDefinitionMeta> =
  | Flatten<
      AuthorFieldBase<FieldMetaOf<TMeta>> & {
        type: "text";
        minLength?: number;
        maxLength?: number;
        pattern?: string;
      }
    >
  | Flatten<
      AuthorFieldBase<FieldMetaOf<TMeta>> & {
        type: "number";
        min?: number;
        max?: number;
        integer?: boolean;
      }
    >
  | Flatten<
      AuthorFieldBase<FieldMetaOf<TMeta>> & {
        type: "boolean";
        unsetOnOff?: boolean;
      }
    >
  | Flatten<
      AuthorFieldBase<FieldMetaOf<TMeta>> & {
        type: "select";
        options: readonly AuthorOption<OptionMetaOf<TMeta>>[];
      }
    >
  | Flatten<
      AuthorFieldBase<FieldMetaOf<TMeta>> & {
        type: "multiSelect";
        options: readonly AuthorOption<OptionMetaOf<TMeta>>[];
      }
    >
  | Flatten<
      AuthorFieldBase<FieldMetaOf<TMeta>> & {
        type: "email";
      }
    >
  | Flatten<
      AuthorFieldBase<FieldMetaOf<TMeta>> & {
        type: "date";
        min?: string;
        max?: string;
      }
    >;

type CustomAuthorFields<
  TFieldTypes extends readonly FieldTypeDefinition[],
  TMeta extends FormDefinitionMeta,
> = [TFieldTypes] extends [readonly []]
  ? never
  : CustomAuthorField<TFieldTypes[number], TMeta>;

/**
 * One authored field document. Built-ins are closed; extra `defineFieldType`
 * entries (from `TFieldTypes`) add branches. Unregistered `type` strings are
 * not in this union — pass them in `TFieldTypes` or use `defineForm`.
 */
export type FieldDocumentFor<
  TFieldTypes extends readonly FieldTypeDefinition[] = [],
  TMeta extends FormDefinitionMeta = FormDefinitionMetaDefault,
> = BuiltinAuthorFields<TMeta> | CustomAuthorFields<TFieldTypes, TMeta>;

/** Field document inferred from one `defineFieldType` (usually via `fieldSchema`). */
export type InferFieldDocument<
  T extends FieldTypeDefinition,
  TMeta extends FormDefinitionMeta = FormDefinitionMetaDefault,
> = CustomAuthorField<T, TMeta>;

/**
 * Code-authored questionnaire document. Pass custom types as `TFieldTypes` so
 * their `fieldSchema` keys autocomplete. `defineForm` stays loose at runtime —
 * use {@link createDefineForm} or `satisfies FormDefinitionFor<TFieldTypes>`.
 */
export type FormDefinitionFor<
  TFieldTypes extends readonly FieldTypeDefinition[] = [],
  TMeta extends FormDefinitionMeta = FormDefinitionMetaDefault,
> = Flatten<{
  title: string;
  description?: string;
  slug?: string;
  status?: FormStatus;
  meta?: FormMetaOf<TMeta>;
  fields: readonly FieldDocumentFor<TFieldTypes, TMeta>[];
}>;
