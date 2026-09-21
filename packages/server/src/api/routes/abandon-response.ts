import {
  FORM_API_OPERATIONS,
  abandonResponseBodySchema,
  type ResponseRecord,
} from "@dimah-form/core";

import { createFormEndpoint } from "@/api/create-form-endpoint";
import { errors } from "@/errors";
import { commitLifecycle, writeResponse } from "@/helpers/lifecycle";
import { responseHookContext } from "@/plugin/context";
import { requireDraft } from "@/validate";

const { method, path } = FORM_API_OPERATIONS.abandonResponse;

export const abandonResponse = createFormEndpoint(
  path,
  { method, body: abandonResponseBodySchema },
  async (ctx): Promise<ResponseRecord> => {
    const existing = await ctx.context.config.database.getResponse(
      ctx.body.responseId,
    );
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
    const hook = () => responseHookContext(ctx.context.config, request, row);
    return commitLifecycle(
      () => hooks.onAbandon?.(hook()),
      () =>
        writeResponse(ctx.context.config.database, row, {
          expectedUpdatedAt: ctx.body.updatedAt,
        }),
      () => hooks.afterAbandon?.(hook()),
    );
  },
);
