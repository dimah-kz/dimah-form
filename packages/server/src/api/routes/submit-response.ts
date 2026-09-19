import {
  FORM_API_OPERATIONS,
  parseAnswers,
  submitResponseBodySchema,
  type ResponseRecord,
} from "@dimah-form/core";

import { createFormEndpoint } from "@/api/create-form-endpoint";
import { errors } from "@/errors";
import { commitLifecycle, writeResponse } from "@/helpers/lifecycle";
import { requireDraft } from "@/validate";

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
    requireDraft(existing);
    const incoming = ctx.body.answers ?? existing.answers;
    const answers = await parseAnswers(
      existing.definition,
      incoming,
      "submit",
      ctx.context.config.fieldTypes,
      ctx.context.config.validateAnswers,
    );
    const now = new Date().toISOString();
    const row: ResponseRecord = {
      ...existing,
      answers,
      status: "submitted",
      submittedAt: now,
      updatedAt: now,
    };
    const request = ctx.context.request;
    const hooks = ctx.context.config.hooks;
    return commitLifecycle(
      () => hooks.onSubmit?.({ request, response: row }),
      () =>
        writeResponse(ctx.context.config.database, row, {
          expectedUpdatedAt: ctx.body.updatedAt,
        }),
      () => hooks.afterSubmit?.({ request, response: row }),
    );
  },
);
