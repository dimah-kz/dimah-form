import * as z from "zod";

import { fieldIdSchema, formIdSchema, trimmedString } from "./shared";

const fieldLabelSchema = z.string().optional();
const fieldRequiredSchema = z.boolean().optional();

/** Shared keys on every field document. Extra keys stay for consumer UI. */
const fieldDocument = {
  id: fieldIdSchema,
  required: fieldRequiredSchema,
  label: fieldLabelSchema,
};

export const textFieldSchema = z.looseObject({
  ...fieldDocument,
  type: z.literal("text"),
});

export const numberFieldSchema = z.looseObject({
  ...fieldDocument,
  type: z.literal("number"),
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
