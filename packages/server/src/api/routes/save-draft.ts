import {
  FORM_API_OPERATIONS,
  saveDraftBodySchema,
  type ResponseRecord,
} from "@dimah-form/core";

import { createFormEndpoint } from "@/api/create-form-endpoint";
import { errors } from "@/errors";
import { applyAnswerPatch, assertAnswers, requireDraft } from "@/validate";

const { method, path } = FORM_API_OPERATIONS.saveDraft;

export const saveDraft = createFormEndpoint(
  path,
  { method, body: saveDraftBodySchema },
  async (ctx): Promise<ResponseRecord> => {
    const existing = await ctx.context.config.database.get(ctx.body.responseId);
    if (!existing) {
      throw errors.unknownResponse(ctx.body.responseId);
    }
    requireDraft(existing.status);
    assertAnswers(
      existing.definition,
      ctx.body.answers,
      "draft",
      ctx.context.config.fieldTypes,
    );
    const answers = applyAnswerPatch(existing.answers, ctx.body.answers);
    const row: ResponseRecord = {
      ...existing,
      answers,
      updatedAt: new Date().toISOString(),
    };
    await ctx.context.config.hooks.onSaveDraft?.({
      request: ctx.context.request,
      response: row,
    });
    await ctx.context.config.database.save(row);
    return row;
  },
);
