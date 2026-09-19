import {
  FORM_API_OPERATIONS,
  saveDraftBodySchema,
  applyAnswerPatch,
  parseAnswers,
  type ResponseRecord,
} from "@dimah-form/core";

import { createFormEndpoint } from "@/api/create-form-endpoint";
import { errors } from "@/errors";
import { commitLifecycle, persistedResponse } from "@/helpers/lifecycle";
import { assertFresh, requireDraft } from "@/validate";

const { method, path } = FORM_API_OPERATIONS.saveDraft;

export const saveDraft = createFormEndpoint(
  path,
  { method, body: saveDraftBodySchema },
  async (ctx): Promise<ResponseRecord> => {
    const existing = await ctx.context.config.database.get(ctx.body.responseId);
    if (!existing) {
      throw errors.unknownResponse(ctx.body.responseId);
    }
    requireDraft(existing);
    assertFresh(existing, ctx.body.updatedAt);
    const merged = applyAnswerPatch(existing.answers, ctx.body.answers);
    const answers = parseAnswers(
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
    await commitLifecycle(
      () => hooks.onSaveDraft?.({ request, response: row }),
      () => ctx.context.config.database.save(row),
      () => hooks.afterSaveDraft?.({ request, response: row }),
    );
    return persistedResponse((id) => ctx.context.config.database.get(id), row);
  },
);
