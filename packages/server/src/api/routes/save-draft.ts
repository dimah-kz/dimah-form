import {
  FORM_API_ROUTES,
  saveDraftBodySchema,
  type ResponseRecord,
} from "@dimah-form/core";

import { createFormEndpoint } from "@/api/create-form-endpoint";
import { errors } from "@/errors";
import { parseAnswers, requireDraft } from "@/validate";

export const saveDraft = createFormEndpoint(
  FORM_API_ROUTES.saveDraft,
  { method: "POST", body: saveDraftBodySchema },
  async (ctx): Promise<ResponseRecord> => {
    const existing = ctx.context.config.store.get(ctx.body.responseId);
    if (!existing) {
      throw errors.unknownResponse(ctx.body.responseId);
    }
    requireDraft(existing.status);
    const answers = parseAnswers(
      existing.definition,
      ctx.body.answers,
      "draft",
    );
    const row: ResponseRecord = {
      ...existing,
      answers,
      updatedAt: new Date().toISOString(),
    };
    ctx.context.config.store.save(row);
    return row;
  },
);
