import {
  FORM_API_OPERATIONS,
  reopenResponseBodySchema,
  type ResponseRecord,
} from "@dimah-form/core";

import { createFormEndpoint } from "@/api/create-form-endpoint";
import { errors } from "@/errors";
import { commitLifecycle, writeResponse } from "@/helpers/lifecycle";
import { responseHookContext } from "@/plugin/context";
import { requireLocked } from "@/validate";

const { method, path } = FORM_API_OPERATIONS.reopenResponse;

export const reopenResponse = createFormEndpoint(
  path,
  { method, body: reopenResponseBodySchema },
  async (ctx): Promise<ResponseRecord> => {
    const existing = await ctx.context.config.database.getResponse(
      ctx.body.responseId,
    );
    if (!existing) {
      throw errors.unknownResponse(ctx.body.responseId);
    }
    requireLocked(existing);
    const row: ResponseRecord = {
      ...existing,
      status: "draft",
      updatedAt: new Date().toISOString(),
    };
    const request = ctx.context.request;
    const hooks = ctx.context.config.hooks;
    const hook = () => responseHookContext(ctx.context.config, request, row);
    return commitLifecycle(
      () => hooks.onReopen?.(hook()),
      () =>
        writeResponse(ctx.context.config.database, row, {
          expectedUpdatedAt: ctx.body.updatedAt,
        }),
      () => hooks.afterReopen?.(hook()),
    );
  },
);
