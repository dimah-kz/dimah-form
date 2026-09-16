import type { FormFetch } from "./create-form-fetch";

type UnionToIntersection<U> = (
  U extends unknown ? (k: U) => void : never
) extends (k: infer I) => void
  ? I
  : Record<string, never>;

/**
 * Browser companion to a server {@link DimahFormPlugin}.
 * Merge onto `createFormClient({ plugins })` — never copy core route strings.
 */
export type FormClientPlugin<
  TEndpoints extends Record<string, (...args: never[]) => unknown> = Record<
    string,
    (...args: never[]) => unknown
  >,
> = {
  readonly id: string;
  endpoints?: (ctx: { $fetch: FormFetch }) => TEndpoints;
};

export type ClientPluginEndpointMap<P extends readonly FormClientPlugin[]> =
  P extends readonly []
    ? Record<string, never>
    : UnionToIntersection<
        P[number] extends {
          endpoints?: (ctx: { $fetch: FormFetch }) => infer E;
        }
          ? E extends Record<string, (...args: never[]) => unknown>
            ? E
            : Record<string, never>
          : Record<string, never>
      >;

export function defineClientPlugin<const T extends FormClientPlugin>(
  plugin: T,
): T {
  return plugin;
}
