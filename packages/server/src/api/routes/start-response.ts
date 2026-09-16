import {
  FORM_API_OPERATIONS,
  startResponseBodySchema,
  type ResponseRecord,
} from "@dimah-form/core";

import { createFormEndpoint } from "@/api/create-form-endpoint";
import { resolveLiveForm } from "@/forms";

const { method, path } = FORM_API_OPERATIONS.startResponse;

export const startResponse = createFormEndpoint(
  path,
  { method, body: startResponseBodySchema },
  async (ctx): Promise<ResponseRecord> => {
    const definition = await resolveLiveForm(
      ctx.context.config,
      ctx.body.formId,
    );
    const now = new Date().toISOString();
    const row: ResponseRecord = {
      id: crypto.randomUUID(),
      formId: definition.id,
      status: "draft",
      definition,
      answers: {},
      respondentId: ctx.body.respondentId ?? null,
      submittedAt: null,
      createdAt: now,
      updatedAt: now,
    };
    await ctx.context.config.hooks.onStart?.({
      request: ctx.context.request,
      response: row,
    });
    await ctx.context.config.database.create(row);
    return row;
  },
);
