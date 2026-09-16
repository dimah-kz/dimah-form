import { defineFieldType } from "@dimah-form/core";
import { z } from "zod";

export const emailFieldType = defineFieldType({
  type: "email",
  fieldSchema: z.looseObject({
    type: z.literal("email"),
    id: z.string(),
    required: z.boolean().optional(),
    label: z.string().optional(),
  }),
  validate: (value) => {
    if (typeof value !== "string") return "Expected a string";
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
      ? undefined
      : "Expected an email";
  },
  $Infer: "" as string,
});

export const fieldTypes = [emailFieldType] as const;
