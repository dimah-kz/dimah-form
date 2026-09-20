import type { z } from "zod";

/**
 * Zod checks for the opaque `meta` bag. Applied at `dimahForm()` / `saveForm`.
 * Plugin bags with {@link AppliedMetaSchema.namespace} run on `meta[namespace]`
 * only when that key is present — so opt-in plugins do not reject plain forms.
 */
export type FormDefinitionMetaSchema = {
  form?: z.ZodType;
  field?: z.ZodType;
  option?: z.ZodType;
};

/** One meta schema after plugin merge — optional namespace from `metaNamespace`. */
export type AppliedMetaSchema = FormDefinitionMetaSchema & {
  namespace?: string;
};

export function assertMetaNamespace(
  namespace: string,
  pluginId: string,
  label: "plugin" | "client plugin",
): string {
  const trimmed = namespace.trim();
  if (trimmed === "") {
    throw new Error(
      `dimah-form ${label} "${pluginId}" metaNamespace must be a non-empty string.`,
    );
  }
  return trimmed;
}

/**
 * Whole-bag schemas always run (`meta ?? {}`). Namespaced schemas run only
 * when `meta` is an object that owns that key.
 */
export function metaSchemaTarget(
  meta: unknown,
  namespace: string | undefined,
): { present: false } | { present: true; value: unknown } {
  if (!namespace) {
    return { present: true, value: meta ?? {} };
  }
  if (meta == null || typeof meta !== "object" || Array.isArray(meta)) {
    return { present: false };
  }
  if (!Object.hasOwn(meta, namespace)) {
    return { present: false };
  }
  return {
    present: true,
    value: (meta as Record<string, unknown>)[namespace],
  };
}
