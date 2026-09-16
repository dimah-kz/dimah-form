import * as z from "zod";

import { formSnapshotSchema, type FormSnapshot } from "./definition";
import { formIdSchema, responseIdSchema, trimmedString } from "./shared";

export const answersSchema = z.record(z.string(), z.unknown());

export const getFormQuerySchema = z.strictObject({
  formId: formIdSchema,
});

export const saveFormBodySchema = formSnapshotSchema;

export const startResponseBodySchema = z.strictObject({
  formId: formIdSchema,
  respondentId: trimmedString.optional(),
});

export const getResponseQuerySchema = z.strictObject({
  responseId: responseIdSchema,
});

export const listResponsesQuerySchema = z.strictObject({
  formId: formIdSchema.optional(),
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
  respondentId: z.string().nullable(),
  submittedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const formListSchema = z.strictObject({
  forms: z.array(formSnapshotSchema),
});

export const responseListSchema = z.strictObject({
  responses: z.array(responseRecordSchema),
});

export type FormAnswers = z.output<typeof answersSchema>;
export type ResponseStatus = z.output<typeof responseStatusSchema>;
export type ResponseRecord = Omit<
  z.output<typeof responseRecordSchema>,
  "definition"
> & {
  definition: FormSnapshot;
};
export type FormList = {
  forms: FormSnapshot[];
};
export type ResponseList = {
  responses: ResponseRecord[];
};
