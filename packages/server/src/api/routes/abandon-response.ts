import {
  FORM_API_OPERATIONS,
  abandonResponseBodySchema,
  type ResponseRecord,
} from "@dimah-form/core";

import { createFormEndpoint } from "@/api/create-form-endpoint";
import { errors } from "@/errors";
import { commitLifecycle, persistedResponse } from "@/helpers/lifecycle";
import { assertFresh, requireDraft } from "@/validate";

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
    assertFresh(existing, ctx.body.updatedAt);
    const row: ResponseRecord = {
      ...existing,
      status: "abandoned",
      updatedAt: new Date().toISOString(),
    };
    const request = ctx.context.request;
    const hooks = ctx.context.config.hooks;
    await commitLifecycle(
      () => hooks.onAbandon?.({ request, response: row }),
      () => ctx.context.config.database.save(row),
      () => hooks.afterAbandon?.({ request, response: row }),
    );
    return persistedResponse((id) => ctx.context.config.database.get(id), row);
  },
);
