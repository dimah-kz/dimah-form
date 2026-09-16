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

export const fieldSchema = z.discriminatedUnion("type", [
  textFieldSchema,
  numberFieldSchema,
  booleanFieldSchema,
  selectFieldSchema,
]);

export const formFieldsSchema = z.array(fieldSchema).check((ctx) => {
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

export type FormField = z.output<typeof fieldSchema>;
export type FormDefinition = z.output<typeof formDefinitionSchema>;
export type FormSnapshot = z.output<typeof formSnapshotSchema>;
