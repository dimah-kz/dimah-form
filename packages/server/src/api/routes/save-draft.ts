import {
  FORM_API_OPERATIONS,
  saveDraftBodySchema,
  applyAnswerPatch,
  parseAnswers,
  type ResponseRecord,
} from "@dimah-form/core";

import { createFormEndpoint } from "@/api/create-form-endpoint";
import { errors } from "@/errors";
import { commitLifecycle, writeResponse } from "@/helpers/lifecycle";
import { responseHookContext } from "@/plugin/context";
import { requireDraft } from "@/validate";

const { method, path } = FORM_API_OPERATIONS.saveDraft;

export const saveDraft = createFormEndpoint(
  path,
  { method, body: saveDraftBodySchema },
  async (ctx): Promise<ResponseRecord> => {
    const existing = await ctx.context.config.database.getResponse(
      ctx.body.responseId,
    );
    if (!existing) {
      throw errors.unknownResponse(ctx.body.responseId);
    }
    requireDraft(existing);
    const merged = applyAnswerPatch(existing.answers, ctx.body.answers);
    const answers = await parseAnswers(
      existing.definition,
      merged,
      "draft",
      ctx.context.config.fieldTypes,
      ctx.context.config.validateAnswers,
    );
    const row: ResponseRecord = {
      ...existing,
      answers,
      updatedAt: new Date().toISOString(),
    };
    const request = ctx.context.request;
    const hooks = ctx.context.config.hooks;
    const hook = () => responseHookContext(ctx.context.config, request, row);
    return commitLifecycle(
      () => hooks.onSaveDraft?.(hook()),
      () =>
        writeResponse(ctx.context.config.database, row, {
          expectedUpdatedAt: ctx.body.updatedAt,
        }),
      () => hooks.afterSaveDraft?.(hook()),
    );
  },
);
