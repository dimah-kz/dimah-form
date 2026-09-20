import type { FieldTypeDefinition } from "../define";
import type { ErrorCodeCatalog } from "../error-codes";
import type {
  FormDefinitionMeta,
  FormDefinitionMetaDefault,
  MergeFormMeta,
} from "../form-definition";

export type UnionToIntersection<U> = (
  U extends unknown ? (k: U) => void : never
) extends (k: infer I) => void
  ? I
  : Record<string, never>;

/**
 * Intersect a union of object types. `never` members (plugins that omit the
 * bag) must not collapse the result to `never`.
 */
export type IntersectDefined<U> = [U] extends [never]
  ? Record<string, never>
  : UnionToIntersection<U>;

/** Any plugin object that participates in `dependsOn` ordering. */
export type PluginIdentity = {
  readonly id: string;
  readonly dependsOn?: readonly string[];
};

type CodesOf<P> = P extends { readonly $ERROR_CODES: infer C }
  ? C extends ErrorCodeCatalog
    ? C
    : never
  : never;

/**
 * Merged `$ERROR_CODES` from a plugin tuple. Empty lists add nothing.
 */
export type PluginErrorCodeMap<
  P extends readonly { readonly $ERROR_CODES?: ErrorCodeCatalog }[],
> = [P] extends [readonly []]
  ? Record<string, never>
  : IntersectDefined<CodesOf<P[number]>>;

type FieldTypesOf<P> = P extends { readonly fieldTypes?: infer F }
  ? F extends readonly FieldTypeDefinition[]
    ? F[number]
    : never
  : never;

/** Field types contributed by a plugin tuple. Empty lists add nothing. */
export type PluginFieldTypeUnion<
  P extends readonly { readonly fieldTypes?: readonly FieldTypeDefinition[] }[],
> = [P] extends [readonly []] ? never : FieldTypesOf<P[number]>;

/** Server or client plugin that can contribute `$Meta` / `fieldTypes` to authoring. */
export type PluginMetaSource = {
  readonly $Meta?: FormDefinitionMeta;
  readonly fieldTypes?: readonly FieldTypeDefinition[];
};

type MetaOf<P> = P extends { readonly $Meta: infer M }
  ? M extends FormDefinitionMeta
    ? M
    : never
  : never;

/**
 * Merged plugin `$Meta` bags, always allowing extra JSON keys (protocol `meta`).
 * Empty lists and plugins that omit `$Meta` yield {@link FormDefinitionMetaDefault}.
 */
export type PluginMetaMap<
  P extends readonly { readonly $Meta?: FormDefinitionMeta }[],
> = [P] extends [readonly []]
  ? FormDefinitionMetaDefault
  : [MetaOf<P[number]>] extends [never]
    ? FormDefinitionMetaDefault
    : MergeFormMeta<
        FormDefinitionMetaDefault,
        IntersectDefined<MetaOf<P[number]>> extends infer I
          ? I extends FormDefinitionMeta
            ? I
            : FormDefinitionMetaDefault
          : FormDefinitionMetaDefault
      >;
