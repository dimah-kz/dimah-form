import {
  FORM_API_OPERATIONS,
  seedDefaultAnswers,
  startResponseBodySchema,
  type ResponseRecord,
} from "@dimah-form/core";

import { createFormEndpoint } from "@/api/create-form-endpoint";
import { errors } from "@/errors";
import { requireActiveForm, resolveLiveForm } from "@/forms";
import { commitLifecycle, persistedResponse } from "@/helpers/lifecycle";

const { method, path } = FORM_API_OPERATIONS.startResponse;

export const startResponse = createFormEndpoint(
  path,
  { method, body: startResponseBodySchema },
  async (ctx): Promise<ResponseRecord> => {
    const definition = await resolveLiveForm(
      ctx.context.config,
      ctx.body.formId,
    );
    if (ctx.body.resume) {
      const respondentId = ctx.body.respondentId;
      if (!respondentId) {
        throw errors.resumeRequiresRespondent();
      }
      const open = await ctx.context.config.database.listResponses({
        formId: definition.id,
        respondentId,
        status: "draft",
        limit: 1,
      });
      if (open[0]) return open[0];
    }
    requireActiveForm(definition);
    const now = new Date().toISOString();
    const row: ResponseRecord = {
      id: crypto.randomUUID(),
      formId: definition.id,
      status: "draft",
      definition,
      answers: seedDefaultAnswers(definition),
      respondentId: ctx.body.respondentId ?? null,
      submittedAt: null,
      createdAt: now,
      updatedAt: now,
    };
    const request = ctx.context.request;
    const hooks = ctx.context.config.hooks;
    await commitLifecycle(
      () => hooks.onStart?.({ request, response: row }),
      () => ctx.context.config.database.create(row),
      () => hooks.afterStart?.({ request, response: row }),
    );
    return persistedResponse((id) => ctx.context.config.database.get(id), row);
  },
);
