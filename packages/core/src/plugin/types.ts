import type { ErrorCodeCatalog } from "../error-codes";

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
