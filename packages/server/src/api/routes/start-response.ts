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
import { responseHookContext } from "@/plugin/context";

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
      const open = await ctx.context.config.database.findLatestDraft({
        formId: definition.id,
        respondentId,
      });
      if (open) return open;
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
    const database = ctx.context.config.database;

    if (ctx.body.resume) {
      await hooks.onStart?.(
        responseHookContext(ctx.context.config, request, row),
      );
      const result = await database.getOrCreateDraft(row);
      if (result.created) {
        await hooks.afterStart?.(
          responseHookContext(ctx.context.config, request, result.row),
        );
      }
      return persistedResponse((id) => database.getResponse(id), result.row);
    }

    await commitLifecycle(
      () =>
        hooks.onStart?.(responseHookContext(ctx.context.config, request, row)),
      () => database.createResponse(row),
      () =>
        hooks.afterStart?.(
          responseHookContext(ctx.context.config, request, row),
        ),
    );
    return persistedResponse((id) => database.getResponse(id), row);
  },
);
