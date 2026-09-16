import * as z from "zod";

import { fieldIdSchema, formIdSchema, trimmedString } from "./shared";

const fieldLabelSchema = z.string().optional();
const fieldRequiredSchema = z.boolean().optional();

/** Live questionnaire lifecycle — independent of response `draft` / `submitted`. */
export const formStatusSchema = z.enum(["draft", "active", "archived"]);

export type FormStatus = z.output<typeof formStatusSchema>;

/** Shared keys on every field document. Extra keys stay for consumer UI. */
const fieldDocument = {
  id: fieldIdSchema,
  required: fieldRequiredSchema,
  label: fieldLabelSchema,
};

export const textFieldSchema = z
  .looseObject({
    ...fieldDocument,
    type: z.literal("text"),
    minLength: z.number().int().min(0).optional(),
    maxLength: z.number().int().min(0).optional(),
    pattern: z
      .string()
      .optional()
      .refine((value) => {
        if (value === undefined) return true;
        try {
          new RegExp(value);
          return true;
        } catch {
          return false;
        }
      }, "Invalid pattern"),
  })
  .check((ctx) => {
    const { minLength, maxLength } = ctx.value;
    if (minLength != null && maxLength != null && minLength > maxLength) {
      ctx.issues.push({
        code: "custom",
        message: "minLength must be <= maxLength",
        input: ctx.value,
      });
    }
  });

export const numberFieldSchema = z
  .looseObject({
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

export const booleanFieldSchema = z.looseObject({
  ...fieldDocument,
  type: z.literal("boolean"),
});

export const selectOptionSchema = z.looseObject({
  value: trimmedString,
  label: fieldLabelSchema,
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

export const selectFieldSchema = z.looseObject({
  ...fieldDocument,
  type: z.literal("select"),
  options: fieldOptionsSchema,
});

export const multiSelectFieldSchema = z.looseObject({
  ...fieldDocument,
  type: z.literal("multiSelect"),
  options: fieldOptionsSchema,
});

/** Built-in field documents only. Custom types use {@link storedFieldSchema}. */
export const fieldSchema = z.discriminatedUnion("type", [
  textFieldSchema,
  numberFieldSchema,
  booleanFieldSchema,
  selectFieldSchema,
  multiSelectFieldSchema,
]);

const builtinFieldByType = {
  text: textFieldSchema,
  number: numberFieldSchema,
  boolean: booleanFieldSchema,
  select: selectFieldSchema,
  multiSelect: multiSelectFieldSchema,
} as const;

/**
 * Snapshot / document field — builtins stay typed; unknown `type` values
 * pass through so custom field types can round-trip. Extra keys are kept.
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

const formMeta = {
  slug: trimmedString.optional(),
  status: formStatusSchema.optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
};

/** Code-authored questionnaire document (no `id` — that is the `forms` key). Extra keys stay for consumer UI. */
export const formDefinitionSchema = z.looseObject({
  title: trimmedString,
  fields: formFieldsSchema,
  ...formMeta,
});

/** Frozen copy stored on a response — definition plus the form id. Extra keys stay. */
export const formSnapshotSchema = z.looseObject({
  id: formIdSchema,
  title: trimmedString,
  fields: formFieldsSchema,
  ...formMeta,
});

export type FormField = {
  id: string;
  type: string;
  required?: boolean;
  label?: string;
} & Record<string, unknown>;

export type FormDefinition = {
  title: string;
  fields: readonly FormField[];
  slug?: string;
  status?: FormStatus;
  createdAt?: string;
  updatedAt?: string;
} & Record<string, unknown>;

export type FormSnapshot = {
  id: string;
  slug: string;
  status: FormStatus;
  title: string;
  fields: readonly FormField[];
  createdAt?: string;
  updatedAt?: string;
} & Record<string, unknown>;

type SnapshotInput = {
  id: string;
  title: string;
  fields: readonly FormField[];
  slug?: string | null;
  status?: FormStatus | null;
  createdAt?: string | null;
  updatedAt?: string | null;
} & Record<string, unknown>;

/** Fill `slug` (defaults to `id`) and `status` (defaults to `active`). Extra keys are kept. */
export function normalizeFormSnapshot(snapshot: SnapshotInput): FormSnapshot {
  const {
    id,
    title,
    fields,
    slug: rawSlug,
    status: rawStatus,
    createdAt,
    updatedAt,
    ...extra
  } = snapshot;
  const slug = rawSlug?.trim();
  return {
    ...extra,
    id,
    title,
    fields,
    slug: slug && slug.length > 0 ? slug : id,
    status: rawStatus ?? "active",
    ...(typeof createdAt === "string" && createdAt.length > 0
      ? { createdAt }
      : {}),
    ...(typeof updatedAt === "string" && updatedAt.length > 0
      ? { updatedAt }
      : {}),
  };
}

export function parseFormSnapshot(input: unknown): FormSnapshot {
  return normalizeFormSnapshot(formSnapshotSchema.parse(input));
}

export function safeParseFormSnapshot(input: unknown) {
  const parsed = formSnapshotSchema.safeParse(input);
  if (!parsed.success) return parsed;
  return { success: true as const, data: normalizeFormSnapshot(parsed.data) };
}
