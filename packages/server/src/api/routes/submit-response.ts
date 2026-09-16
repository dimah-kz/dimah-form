import {
  FORM_API_OPERATIONS,
  submitResponseBodySchema,
  type ResponseRecord,
} from "@dimah-form/core";

import { createFormEndpoint } from "@/api/create-form-endpoint";
import { errors } from "@/errors";
import { parseAnswers, requireDraft } from "@/validate";

const { method, path } = FORM_API_OPERATIONS.submitResponse;

export const submitResponse = createFormEndpoint(
  path,
  {
    method,
    body: submitResponseBodySchema,
  },
  async (ctx): Promise<ResponseRecord> => {
    const existing = await ctx.context.config.database.get(ctx.body.responseId);
    if (!existing) {
      throw errors.unknownResponse(ctx.body.responseId);
    }
    requireDraft(existing.status);
    const answers = parseAnswers(
      existing.definition,
      ctx.body.answers,
      "submit",
      ctx.context.config.fieldTypes,
    );
    const now = new Date().toISOString();
    const row: ResponseRecord = {
      ...existing,
      answers,
      status: "submitted",
      submittedAt: now,
      updatedAt: now,
    };
    await ctx.context.config.hooks.onSubmit?.({
      request: ctx.context.request,
      response: row,
    });
    await ctx.context.config.database.save(row);
    return row;
  },
);
