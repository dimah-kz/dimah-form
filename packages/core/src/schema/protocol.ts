import * as z from "zod";

import { formSnapshotSchema, type FormSnapshot } from "./definition";
import { formIdSchema, responseIdSchema } from "./shared";

export const answersSchema = z.record(z.string(), z.unknown());

export const getFormQuerySchema = z.strictObject({
  formId: formIdSchema,
});

export const startResponseBodySchema = z.strictObject({
  formId: formIdSchema,
});

export const getResponseQuerySchema = z.strictObject({
  responseId: responseIdSchema,
});

export const saveDraftBodySchema = z.strictObject({
  responseId: responseIdSchema,
  answers: answersSchema,
});

export const submitResponseBodySchema = z.strictObject({
  responseId: responseIdSchema,
  answers: answersSchema,
});

export const responseStatusSchema = z.enum(["draft", "submitted"]);

export const responseRecordSchema = z.strictObject({
  id: responseIdSchema,
  formId: formIdSchema,
  status: responseStatusSchema,
  definition: formSnapshotSchema,
  answers: answersSchema,
  submittedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type FormAnswers = z.output<typeof answersSchema>;
export type ResponseStatus = z.output<typeof responseStatusSchema>;
export type ResponseRecord = Omit<
  z.output<typeof responseRecordSchema>,
  "definition"
> & {
  definition: FormSnapshot;
};
