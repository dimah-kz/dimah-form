import {
  FORM_API_ROUTES,
  submitResponseBodySchema,
  type ResponseRecord,
} from "@dimah-form/core";

import { createFormEndpoint } from "@/api/create-form-endpoint";
import { errors } from "@/errors";
import { parseAnswers, requireDraft } from "@/validate";

export const submitResponse = createFormEndpoint(
  FORM_API_ROUTES.submitResponse,
  { method: "POST", body: submitResponseBodySchema },
  async (ctx): Promise<ResponseRecord> => {
    const existing = ctx.context.config.store.get(ctx.body.responseId);
    if (!existing) {
      throw errors.unknownResponse(ctx.body.responseId);
    }
    requireDraft(existing.status);
    const answers = parseAnswers(
      existing.definition,
      ctx.body.answers,
      "submit",
    );
    const now = new Date().toISOString();
    const row: ResponseRecord = {
      ...existing,
      answers,
      status: "submitted",
      submittedAt: now,
      updatedAt: now,
    };
    ctx.context.config.store.save(row);
    return row;
  },
);
