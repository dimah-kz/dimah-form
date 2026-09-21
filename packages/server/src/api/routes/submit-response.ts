import {
  FORM_API_OPERATIONS,
  parseAnswers,
  submitResponseBodySchema,
  type ResponseRecord,
} from "@dimah-form/core";

import { createFormEndpoint } from "@/api/create-form-endpoint";
import { errors } from "@/errors";
import { commitLifecycle, writeResponse } from "@/helpers/lifecycle";
import { responseHookContext } from "@/plugin/context";
import { requireDraft } from "@/validate";

const { method, path } = FORM_API_OPERATIONS.submitResponse;

export const submitResponse = createFormEndpoint(
  path,
  {
    method,
    body: submitResponseBodySchema,
  },
  async (ctx): Promise<ResponseRecord> => {
    const existing = await ctx.context.config.database.getResponse(
      ctx.body.responseId,
    );
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
    const hook = () => responseHookContext(ctx.context.config, request, row);
    return commitLifecycle(
      () => hooks.onSubmit?.(hook()),
      () =>
        writeResponse(ctx.context.config.database, row, {
          expectedUpdatedAt: ctx.body.updatedAt,
        }),
      () => hooks.afterSubmit?.(hook()),
    );
  },
);
