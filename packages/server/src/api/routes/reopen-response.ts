import {
  FORM_API_OPERATIONS,
  reopenResponseBodySchema,
  type ResponseRecord,
} from "@dimah-form/core";

import { createFormEndpoint } from "@/api/create-form-endpoint";
import { errors } from "@/errors";
import { commitLifecycle, persistedResponse } from "@/helpers/lifecycle";
import { assertFresh, requireLocked } from "@/validate";

const { method, path } = FORM_API_OPERATIONS.reopenResponse;

export const reopenResponse = createFormEndpoint(
  path,
  { method, body: reopenResponseBodySchema },
  async (ctx): Promise<ResponseRecord> => {
    const existing = await ctx.context.config.database.get(ctx.body.responseId);
    if (!existing) {
      throw errors.unknownResponse(ctx.body.responseId);
    }
    requireLocked(existing);
    assertFresh(existing, ctx.body.updatedAt);
    const row: ResponseRecord = {
      ...existing,
      status: "draft",
      updatedAt: new Date().toISOString(),
    };
    const request = ctx.context.request;
    const hooks = ctx.context.config.hooks;
    await commitLifecycle(
      () => hooks.onReopen?.({ request, response: row }),
      () => ctx.context.config.database.save(row),
      () => hooks.afterReopen?.({ request, response: row }),
    );
    return persistedResponse((id) => ctx.context.config.database.get(id), row);
  },
);
