import * as z from "zod";

/** `params` bag on API error JSON. */
export const formErrorParamsSchema = z.record(
  z.string(),
  z.union([z.string(), z.number()]),
);

export const validationIssueSchema = z.object({
  field: z.string(),
  message: z.string(),
});

/**
 * better-fetch `errorSchema` — same `{ message, code?, params?, issues? }`
 * body better-call serializes from `APIError`.
 */
export const formFetchErrorSchema = z.object({
  message: z.string(),
  code: z.string().optional(),
  params: formErrorParamsSchema.optional(),
  issues: z.array(validationIssueSchema).optional(),
});

export type ValidationIssue = z.output<typeof validationIssueSchema>;
export type FormFetchError = z.output<typeof formFetchErrorSchema>;
