import {
  FORM_API_ROUTES,
  startResponseBodySchema,
  type ResponseRecord,
} from "@dimah-form/core";

import { createFormEndpoint } from "@/api/create-form-endpoint";
import { resolveLiveForm } from "@/forms";

export const startResponse = createFormEndpoint(
  FORM_API_ROUTES.startResponse,
  { method: "POST", body: startResponseBodySchema },
  async (ctx): Promise<ResponseRecord> => {
    const definition = resolveLiveForm(
      ctx.context.config.forms,
      ctx.body.formId,
    );
    const now = new Date().toISOString();
    const row: ResponseRecord = {
      id: crypto.randomUUID(),
      formId: definition.id,
      status: "draft",
      definition,
      answers: {},
      submittedAt: null,
      createdAt: now,
      updatedAt: now,
    };
    await ctx.context.config.database.create(row);
    return row;
  },
);
