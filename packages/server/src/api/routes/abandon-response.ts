import {
  FORM_API_OPERATIONS,
  abandonResponseBodySchema,
  type ResponseRecord,
} from "@dimah-form/core";

import { createFormEndpoint } from "@/api/create-form-endpoint";
import { errors } from "@/errors";
import { commitLifecycle, writeResponse } from "@/helpers/lifecycle";
import { requireDraft } from "@/validate";

const { method, path } = FORM_API_OPERATIONS.abandonResponse;

export const abandonResponse = createFormEndpoint(
  path,
  { method, body: abandonResponseBodySchema },
  async (ctx): Promise<ResponseRecord> => {
    const existing = await ctx.context.config.database.get(ctx.body.responseId);
    if (!existing) {
      throw errors.unknownResponse(ctx.body.responseId);
    }
    requireDraft(existing);
    const row: ResponseRecord = {
      ...existing,
      status: "abandoned",
      updatedAt: new Date().toISOString(),
    };
    const request = ctx.context.request;
    const hooks = ctx.context.config.hooks;
    return commitLifecycle(
      () => hooks.onAbandon?.({ request, response: row }),
      () =>
        writeResponse(ctx.context.config.database, row, {
          expectedUpdatedAt: ctx.body.updatedAt,
        }),
      () => hooks.afterAbandon?.({ request, response: row }),
    );
  },
);
