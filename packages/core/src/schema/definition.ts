import * as z from "zod";

import { fieldIdSchema, formIdSchema, trimmedString } from "./shared";

const fieldLabelSchema = z.string().optional();
const fieldRequiredSchema = z.boolean().optional();

/** Live questionnaire lifecycle — independent of response `draft` / `submitted`. */
export const formStatusSchema = z.enum(["draft", "active", "archived"]);

export type FormStatus = z.output<typeof formStatusSchema>;

/**
 * Opaque JSON bag on a form, field, or option. The engine does not read this —
 * type-specific validation stays on the field document / `fieldSchema`.
 */
export const documentMetaSchema = z.record(z.string(), z.json());

export type DocumentMeta = z.output<typeof documentMetaSchema>;

/** Sibling visibility — field is skipped when the rule does not match. */
export const showWhenSchema = z
  .looseObject({
    field: fieldIdSchema,
    equals: z.unknown().optional(),
    includes: z.unknown().optional(),
  })
  .check((ctx) => {
    if (ctx.value.equals === undefined && ctx.value.includes === undefined) {
      ctx.issues.push({
        code: "custom",
        message: "showWhen requires equals or includes",
        input: ctx.value,
      });
    }
  });

export type FieldShowWhen = z.output<typeof showWhenSchema>;

/** Shared protocol keys on every field document. */
const fieldDocument = {
  id: fieldIdSchema,
  required: fieldRequiredSchema,
  label: fieldLabelSchema,
  description: z.string().optional(),
  defaultValue: z.unknown().optional(),
  showWhen: showWhenSchema.optional(),
  meta: documentMetaSchema.optional(),
};

export const textFieldSchema = z
  .strictObject({
    ...fieldDocument,
    type: z.literal("text"),
    minLength: z.int().nonnegative().optional(),
    maxLength: z.int().nonnegative().optional(),
    pattern: z.string().optional(),
  })
  .check((ctx) => {
    const { minLength, maxLength, pattern } = ctx.value;
    if (pattern !== undefined) {
      try {
        new RegExp(pattern);
      } catch {
        ctx.issues.push({
          code: "custom",
          message: "Invalid pattern",
          input: ctx.value,
        });
      }
    }
    if (minLength != null && maxLength != null && minLength > maxLength) {
      ctx.issues.push({
        code: "custom",
        message: "minLength must be <= maxLength",
        input: ctx.value,
      });
    }
  });

export const numberFieldSchema = z
  .strictObject({
    ...fieldDocument,
    type: z.literal("number"),
    min: z.number().optional(),
    max: z.number().optional(),
    integer: z.boolean().optional(),
  })
  .check((ctx) => {
    const { min, max } = ctx.value;
    if (min != null && max != null && min > max) {
      ctx.issues.push({
        code: "custom",
        message: "min must be <= max",
        input: ctx.value,
      });
    }
  });

export const booleanFieldSchema = z.strictObject({
  ...fieldDocument,
  type: z.literal("boolean"),
});

export const selectOptionSchema = z.strictObject({
  value: trimmedString,
  label: fieldLabelSchema,
  meta: documentMetaSchema.optional(),
});

const fieldOptionsSchema = z
  .array(selectOptionSchema)
  .min(1)
  .check((ctx) => {
    const seen = new Set<string>();
    for (const option of ctx.value) {
      if (seen.has(option.value)) {
        ctx.issues.push({
          code: "custom",
          message: `Duplicate option value "${option.value}"`,
          input: ctx.value,
        });
        return;
      }
      seen.add(option.value);
    }
  });

export const selectFieldSchema = z.strictObject({
  ...fieldDocument,
  type: z.literal("select"),
  options: fieldOptionsSchema,
});

export const multiSelectFieldSchema = z.strictObject({
  ...fieldDocument,
  type: z.literal("multiSelect"),
  options: fieldOptionsSchema,
});

export const emailFieldSchema = z.strictObject({
  ...fieldDocument,
  type: z.literal("email"),
});

export const dateFieldSchema = z.strictObject({
  ...fieldDocument,
  type: z.literal("date"),
});

/** Built-in field documents only. Custom types use {@link storedFieldSchema}. */
export const fieldSchema = z.discriminatedUnion("type", [
  textFieldSchema,
  numberFieldSchema,
  booleanFieldSchema,
  selectFieldSchema,
  multiSelectFieldSchema,
  emailFieldSchema,
  dateFieldSchema,
]);

const builtinFieldByType = {
  text: textFieldSchema,
  number: numberFieldSchema,
  boolean: booleanFieldSchema,
  select: selectFieldSchema,
  multiSelect: multiSelectFieldSchema,
  email: emailFieldSchema,
  date: dateFieldSchema,
} as const;

/**
 * Snapshot / document field — builtins stay typed; unknown `type` values
 * pass through so custom field types can round-trip type-specific keys.
 */
export const storedFieldSchema = z
  .looseObject({
    ...fieldDocument,
    type: trimmedString,
  })
  .check((ctx) => {
    const builtin =
      builtinFieldByType[ctx.value.type as keyof typeof builtinFieldByType];
    if (!builtin) return;
    const parsed = builtin.safeParse(ctx.value);
    if (parsed.success) return;
    ctx.issues.push({
      code: "custom",
      message:
        parsed.error.issues[0]?.message ?? `Invalid "${ctx.value.type}" field`,
      input: ctx.value,
    });
  });

export const formFieldsSchema = z.array(storedFieldSchema).check((ctx) => {
  const seen = new Set<string>();
  for (const field of ctx.value) {
    if (seen.has(field.id)) {
      ctx.issues.push({
        code: "custom",
        message: `Duplicate field id "${field.id}"`,
        input: ctx.value,
      });
      return;
    }
    seen.add(field.id);
  }
});

const formLifecycle = {
  slug: trimmedString.optional(),
  status: formStatusSchema.optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
};

const formDocument = {
  title: trimmedString,
  description: z.string().optional(),
  fields: formFieldsSchema,
  meta: documentMetaSchema.optional(),
  ...formLifecycle,
};

/** Code-authored questionnaire document (no `id` — that is the `forms` key). */
export const formDefinitionSchema = z.strictObject(formDocument);

const formSnapshotDocumentSchema = z.strictObject({
  id: formIdSchema,
  ...formDocument,
});

export type SelectOption = {
  value: string;
  label?: string;
  meta?: DocumentMeta;
};

export interface FormField {
  id: string;
  type: string;
  required?: boolean;
  label?: string;
  description?: string;
  defaultValue?: unknown;
  showWhen?: FieldShowWhen;
  meta?: DocumentMeta;
  [key: string]: unknown;
}

export type FormDefinition = {
  title: string;
  description?: string;
  fields: readonly FormField[];
  slug?: string;
  status?: FormStatus;
  createdAt?: string;
  updatedAt?: string;
  meta?: DocumentMeta;
};

export type FormSnapshot = {
  id: string;
  slug: string;
  status: FormStatus;
  title: string;
  description?: string;
  fields: readonly FormField[];
  createdAt?: string;
  updatedAt?: string;
  meta?: DocumentMeta;
};

type SnapshotInput = {
  id: string;
  title: string;
  description?: string | null;
  fields: readonly FormField[];
  slug?: string | null;
  status?: FormStatus | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  meta?: DocumentMeta | null;
};

function nonEmptyString(value: string | null | undefined) {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

/** Fill `slug` (defaults to `id`) and `status` (defaults to `active`). */
export function normalizeFormSnapshot(snapshot: SnapshotInput): FormSnapshot {
  const slug = snapshot.slug?.trim();
  const description =
    typeof snapshot.description === "string" ? snapshot.description : undefined;
  const meta = snapshot.meta ?? undefined;
  const createdAt = nonEmptyString(snapshot.createdAt);
  const updatedAt = nonEmptyString(snapshot.updatedAt);
  return {
    id: snapshot.id,
    title: snapshot.title,
    fields: snapshot.fields,
    slug: slug && slug.length > 0 ? slug : snapshot.id,
    status: snapshot.status ?? "active",
    ...(description !== undefined ? { description } : {}),
    ...(meta !== undefined ? { meta } : {}),
    ...(createdAt !== undefined ? { createdAt } : {}),
    ...(updatedAt !== undefined ? { updatedAt } : {}),
  };
}

const formSnapshotNormalizedSchema = formSnapshotDocumentSchema.extend({
  slug: trimmedString,
  status: formStatusSchema,
});

/** Frozen copy stored on a response — definition plus the form id. */
export const formSnapshotSchema = z.codec(
  formSnapshotDocumentSchema,
  formSnapshotNormalizedSchema,
  {
    decode: (value) =>
      normalizeFormSnapshot(value) as z.output<
        typeof formSnapshotNormalizedSchema
      >,
    encode: (value) => value,
  },
);

export function parseFormSnapshot(input: unknown): FormSnapshot {
  return formSnapshotSchema.parse(input);
}

export function safeParseFormSnapshot(input: unknown) {
  const parsed = formSnapshotSchema.safeParse(input);
  if (!parsed.success) return parsed;
  return { success: true as const, data: parsed.data };
}
