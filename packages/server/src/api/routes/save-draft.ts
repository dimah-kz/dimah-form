import {
  FORM_API_ROUTES,
  saveDraftBodySchema,
  type ResponseRecord,
} from "@dimah-form/core";

import { createFormEndpoint } from "@/api/create-form-endpoint";
import { errors } from "@/errors";
import { applyAnswerPatch, parseAnswers, requireDraft } from "@/validate";

export const saveDraft = createFormEndpoint(
  FORM_API_ROUTES.saveDraft,
  { method: "POST", body: saveDraftBodySchema },
  async (ctx): Promise<ResponseRecord> => {
    const existing = await ctx.context.config.database.get(ctx.body.responseId);
    if (!existing) {
      throw errors.unknownResponse(ctx.body.responseId);
    }
    requireDraft(existing.status);
    parseAnswers(
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
    await ctx.context.config.database.save(row);
    return row;
  },
);
