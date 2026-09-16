import * as z from "zod";

import { fieldIdSchema, formIdSchema, trimmedString } from "./shared";

const fieldLabelSchema = z.string().optional();
const fieldRequiredSchema = z.boolean().optional();

export const textFieldSchema = z.strictObject({
  id: fieldIdSchema,
  type: z.literal("text"),
  required: fieldRequiredSchema,
  label: fieldLabelSchema,
});

export const numberFieldSchema = z.strictObject({
  id: fieldIdSchema,
  type: z.literal("number"),
  required: fieldRequiredSchema,
  label: fieldLabelSchema,
});

export const booleanFieldSchema = z.strictObject({
  id: fieldIdSchema,
  type: z.literal("boolean"),
  required: fieldRequiredSchema,
  label: fieldLabelSchema,
});

export const selectOptionSchema = z.strictObject({
  value: trimmedString,
  label: fieldLabelSchema,
});

export const selectFieldSchema = z.strictObject({
  id: fieldIdSchema,
  type: z.literal("select"),
  required: fieldRequiredSchema,
  label: fieldLabelSchema,
  options: z
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
    }),
});

/** Built-in field documents only. Custom types use {@link storedFieldSchema}. */
export const fieldSchema = z.discriminatedUnion("type", [
  textFieldSchema,
  numberFieldSchema,
  booleanFieldSchema,
  selectFieldSchema,
]);

const builtinFieldByType = {
  text: textFieldSchema,
  number: numberFieldSchema,
  boolean: booleanFieldSchema,
  select: selectFieldSchema,
} as const;

/**
 * Snapshot / document field — builtins stay strict; unknown `type` values
 * pass through so custom field types can round-trip.
 */
export const storedFieldSchema = z
  .looseObject({
    id: fieldIdSchema,
    type: trimmedString,
    required: fieldRequiredSchema,
    label: fieldLabelSchema,
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

/** Code-authored questionnaire document (no `id` — that is the `forms` key). */
export const formDefinitionSchema = z.strictObject({
  title: trimmedString,
  fields: formFieldsSchema,
});

/** Frozen copy stored on a response — definition plus the form id. */
export const formSnapshotSchema = z.strictObject({
  id: formIdSchema,
  title: trimmedString,
  fields: formFieldsSchema,
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
};

export type FormSnapshot = {
  id: string;
  title: string;
  fields: readonly FormField[];
};
