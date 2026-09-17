import { defineFieldType } from "@dimah-form/core";
import * as z from "zod";

function asFiniteNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
}

export const ratingFieldType = defineFieldType({
  type: "rating",
  fieldSchema: z
    .looseObject({
      type: z.literal("rating"),
      min: z.number().int().min(1).optional(),
      max: z.number().int().min(1).optional(),
    })
    .check((ctx) => {
      const min = ctx.value.min ?? 1;
      const max = ctx.value.max ?? 5;
      if (min > max) {
        ctx.issues.push({
          code: "custom",
          message: "min must be <= max",
          input: ctx.value,
        });
      }
    }),
  validate: (value, field) => {
    if (typeof value !== "number" || !Number.isInteger(value)) {
      return "Expected an integer";
    }
    const min = asFiniteNumber(field.min) ?? 1;
    const max = asFiniteNumber(field.max) ?? 5;
    if (value < min) return `Must be at least ${min}`;
    if (value > max) return `Must be at most ${max}`;
    return undefined;
  },
  $Infer: 0 as number,
});

export const fieldTypes = [ratingFieldType] as const;
